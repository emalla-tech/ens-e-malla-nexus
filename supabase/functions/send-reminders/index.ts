import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

interface Preferences {
  enabled?: boolean;
  tasks?: boolean;
  meetings?: boolean;
  meetingReminderMinutes?: number;
  followUps?: boolean;
  reminders?: boolean;
  finance?: boolean;
  sound?: boolean;
  vibration?: boolean;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  timezone: string;
  preferences: Preferences;
}

interface Alert {
  key: string;
  title: string;
  body: string;
  url: string;
}

const corsHeaders = { 'Content-Type': 'application/json' };

function localParts(timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
  return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${get('hour')}:${get('minute')}` };
}

function isQuietTime(time: string, preferences: Preferences) {
  if (!preferences.quietHoursEnabled) return false;
  const start = preferences.quietHoursStart ?? '22:00';
  const end = preferences.quietHoursEnd ?? '06:00';
  return start <= end ? time >= start && time < end : time >= start || time < end;
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.slice(0, 5).split(':').map(Number);
  return hours * 60 + minutes;
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  if (request.headers.get('x-cron-secret') !== Deno.env.get('CRON_SECRET')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const publicKey = Deno.env.get('VAPID_PUBLIC_KEY');
  const privateKey = Deno.env.get('VAPID_PRIVATE_KEY');
  if (!supabaseUrl || !serviceRoleKey || !publicKey || !privateKey) {
    return new Response(JSON.stringify({ error: 'Missing server configuration.' }), { status: 500, headers: corsHeaders });
  }

  webpush.setVapidDetails(Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@emalla.rw', publicKey, privateKey);
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data: subscriptions, error } = await supabase.from('push_subscriptions').select('*');
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });

  let sent = 0;
  for (const subscription of (subscriptions ?? []) as PushSubscriptionRow[]) {
    const preferences = subscription.preferences ?? {};
    if (preferences.enabled === false) continue;
    const { date, time } = localParts(subscription.timezone || 'Africa/Kigali');
    if (isQuietTime(time, preferences)) continue;

    const alerts: Alert[] = [];
    if (preferences.tasks !== false) {
      const { data: tasks } = await supabase.from('tasks').select('id,title,due_date,priority').eq('user_id', subscription.user_id).lte('due_date', date).not('status', 'in', '(Completed,Cancelled)').limit(5);
      for (const task of tasks ?? []) alerts.push({ key: `task:${task.id}:${date}`, title: task.due_date < date ? 'Overdue task' : 'Task due today', body: `${task.title} · ${task.priority} priority`, url: '/tasks' });
    }
    if (preferences.followUps !== false) {
      const { data: followUps } = await supabase.from('follow_ups').select('id,customer,due_date,next_step').eq('user_id', subscription.user_id).lte('due_date', date).neq('status', 'Completed').limit(5);
      for (const followUp of followUps ?? []) alerts.push({ key: `follow-up:${followUp.id}:${date}`, title: 'Customer follow-up', body: `${followUp.customer}: ${followUp.next_step}`, url: '/customers' });
    }
    if (preferences.meetings !== false) {
      const { data: meetings } = await supabase.from('meetings').select('id,title,date,time,location').eq('user_id', subscription.user_id).eq('date', date).gte('time', time).limit(5);
      const currentMinutes = timeToMinutes(time);
      const reminderWindow = preferences.meetingReminderMinutes ?? 30;
      for (const meeting of meetings ?? []) {
        const meetingMinutes = timeToMinutes(String(meeting.time));
        if (meetingMinutes - currentMinutes > reminderWindow) continue;
        alerts.push({ key: `meeting:${meeting.id}:${date}`, title: `Meeting at ${String(meeting.time).slice(0, 5)}`, body: `${meeting.title} · ${meeting.location}`, url: '/calendar' });
      }
    }
    if (preferences.reminders !== false) {
      const { data: reminders } = await supabase.from('reminders').select('id,title,notes,category,reminder_date,reminder_time').eq('user_id', subscription.user_id).eq('status', 'Active').lte('reminder_date', date).limit(10);
      for (const reminder of reminders ?? []) {
        const reminderTime = String(reminder.reminder_time).slice(0, 5);
        if (reminder.reminder_date === date && reminderTime > time) continue;
        alerts.push({
          key: `reminder:${reminder.id}:${reminder.reminder_date}:${reminderTime}`,
          title: `Reminder: ${reminder.title}`,
          body: reminder.notes || `${reminder.category} reminder`,
          url: '/reminders',
        });
      }
    }
    if (preferences.finance !== false) {
      const { data: invoices } = await supabase.from('invoices').select('id,invoice_number,customer_name,amount,due_date,status').eq('user_id', subscription.user_id).lt('due_date', date).not('status', 'in', '(Paid,Cancelled,Draft)').limit(5);
      for (const invoice of invoices ?? []) alerts.push({ key: `invoice:${invoice.id}:${date}`, title: `Invoice overdue: ${invoice.invoice_number}`, body: `${invoice.customer_name} owes RWF ${Number(invoice.amount).toLocaleString()}`, url: '/finance' });
    }

    for (const alert of alerts) {
      const { data: delivered } = await supabase.from('notification_deliveries').select('id').eq('subscription_id', subscription.id).eq('alert_key', alert.key).maybeSingle();
      if (delivered) continue;
      try {
        await webpush.sendNotification(
          { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
          JSON.stringify({ ...alert, vibration: preferences.vibration !== false }),
        );
        await supabase.from('notification_deliveries').insert({ subscription_id: subscription.id, alert_key: alert.key });
        sent += 1;
      } catch (pushError) {
        const statusCode = (pushError as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) await supabase.from('push_subscriptions').delete().eq('id', subscription.id);
      }
    }
  }

  return new Response(JSON.stringify({ sent }), { headers: corsHeaders });
});
