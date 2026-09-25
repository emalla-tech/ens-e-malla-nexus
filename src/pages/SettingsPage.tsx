import { BellRing, Building2, CheckCircle2, Smartphone, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AuthPanel } from '../components/AuthPanel';
import { Button } from '../components/Button';
import { Logo } from '../components/Logo';
import { useNotificationPreferences } from '../hooks/useNotificationPreferences';
import {
  connectServerPush,
  disconnectServerPush,
  getNotificationPermission,
  getServerPushSubscription,
  isServerPushConfigured,
  requestNotificationPermission,
  showTestNotification,
  updateServerPushPreferences,
} from '../services/notificationService';
import { isSupabaseConfigured } from '../services/supabase';

function Toggle({ checked, label, onChange }: { checked: boolean; label: string; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center justify-between gap-4 border-b border-gray-100 py-3 last:border-b-0">
      <span className="text-sm font-semibold text-gray-700">{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-5 w-5 accent-orange-600" />
    </label>
  );
}

export function SettingsPage() {
  const [preferences, setPreferences] = useNotificationPreferences();
  const [permission, setPermission] = useState(getNotificationPermission());
  const [notificationMessage, setNotificationMessage] = useState('');
  const [serverPushConnected, setServerPushConnected] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => {
    void getServerPushSubscription().then((subscription) => setServerPushConnected(Boolean(subscription)));
  }, []);

  useEffect(() => {
    if (!serverPushConnected) return;
    const timeout = window.setTimeout(() => {
      void updateServerPushPreferences(preferences).catch(() => {
        setNotificationMessage('Preferences were saved on this phone, but server sync failed.');
      });
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [preferences, serverPushConnected]);

  function updatePreference<Key extends keyof typeof preferences>(key: Key, value: (typeof preferences)[Key]) {
    setPreferences((current) => ({ ...current, [key]: value }));
  }

  async function enableNotifications() {
    setNotificationMessage('');
    const nextPermission = await requestNotificationPermission();
    setPermission(nextPermission);
    updatePreference('enabled', nextPermission === 'granted');
    setNotificationMessage(nextPermission === 'granted' ? 'Phone notifications are enabled.' : 'Permission was not granted. Enable notifications in your phone browser settings.');
  }

  async function sendTestNotification() {
    setNotificationMessage('');
    try {
      await showTestNotification(preferences.vibration);
      setNotificationMessage('Test notification sent successfully.');
    } catch (error) {
      setNotificationMessage(error instanceof Error ? error.message : 'Could not send the test notification.');
    }
  }

  async function connectPush() {
    setPushBusy(true);
    setNotificationMessage('');
    try {
      await connectServerPush({ ...preferences, enabled: true });
      updatePreference('enabled', true);
      setServerPushConnected(true);
      setNotificationMessage('This phone is connected to ENs server reminders.');
    } catch (error) {
      setNotificationMessage(error instanceof Error ? error.message : 'Could not connect this phone to server push.');
    } finally {
      setPushBusy(false);
    }
  }

  async function disconnectPush() {
    setPushBusy(true);
    setNotificationMessage('');
    try {
      await disconnectServerPush();
      updatePreference('enabled', false);
      setServerPushConnected(false);
      setNotificationMessage('Server reminders are paused on this phone.');
    } catch (error) {
      setNotificationMessage(error instanceof Error ? error.message : 'Could not pause server reminders.');
    } finally {
      setPushBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-orange">Settings</p>
        <h1 className="mt-2 text-3xl font-black text-brand-black">Workspace settings</h1>
        <p className="mt-2 max-w-2xl text-gray-500">
          Manage account, company profile, product identity, and future integration readiness.
        </p>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <AuthPanel />

        <article className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
          <UserRound className="text-brand-orange" size={24} />
          <h2 className="mt-4 text-xl font-black text-brand-black">Profile</h2>
          <div className="mt-5 grid gap-4">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-gray-700">Name</span>
              <input className="min-h-11 w-full rounded-md border border-gray-200 px-3 outline-none focus:border-brand-orange" defaultValue="John" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-gray-700">Role</span>
              <input className="min-h-11 w-full rounded-md border border-gray-200 px-3 outline-none focus:border-brand-orange" defaultValue="Founder" />
            </label>
          </div>
        </article>

        <article className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
          <Building2 className="text-brand-orange" size={24} />
          <h2 className="mt-4 text-xl font-black text-brand-black">Company</h2>
          <div className="mt-5 grid gap-4">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-gray-700">Product name</span>
              <div className="flex min-h-11 items-center rounded-md border border-gray-200 px-3">
                <Logo dark />
              </div>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-gray-700">Supabase status</span>
              <input
                className="min-h-11 w-full rounded-md border border-gray-200 px-3 outline-none focus:border-brand-orange"
                value={isSupabaseConfigured() ? 'Configured' : 'Ready for future configuration'}
                readOnly
              />
            </label>
          </div>
        </article>

        <article className="rounded-md border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div className="flex gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-orange-50 text-brand-orange"><BellRing size={22} /></div>
              <div><h2 className="text-xl font-black text-brand-black">Phone notifications</h2><p className="mt-1 text-sm leading-6 text-gray-500">Choose which executive alerts can reach this device and when.</p></div>
            </div>
            <span className={`inline-flex min-h-8 items-center gap-2 self-start rounded-md px-3 text-xs font-bold ${permission === 'granted' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
              {permission === 'granted' ? <CheckCircle2 size={15} /> : <Smartphone size={15} />}
              {permission === 'granted' ? 'Allowed on this device' : permission === 'denied' ? 'Blocked by device' : permission === 'unsupported' ? 'Not supported' : 'Permission needed'}
            </span>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div>
              <Toggle checked={preferences.tasks} label="Task due and overdue alerts" onChange={(value) => updatePreference('tasks', value)} />
              <Toggle checked={preferences.meetings} label="Upcoming meeting reminders" onChange={(value) => updatePreference('meetings', value)} />
              <Toggle checked={preferences.followUps} label="Customer follow-up reminders" onChange={(value) => updatePreference('followUps', value)} />
              <Toggle checked={preferences.goals} label="Goal progress alerts" onChange={(value) => updatePreference('goals', value)} />
              <Toggle checked={preferences.reminders} label="Standalone reminder alerts" onChange={(value) => updatePreference('reminders', value)} />
              <Toggle checked={preferences.sound} label="Use device notification sound" onChange={(value) => updatePreference('sound', value)} />
              <Toggle checked={preferences.vibration} label="Vibrate when supported" onChange={(value) => updatePreference('vibration', value)} />
            </div>

            <div className="grid content-start gap-4">
              <label className="space-y-2"><span className="text-sm font-semibold text-gray-700">Meeting reminder</span><select value={preferences.meetingReminderMinutes} onChange={(event) => updatePreference('meetingReminderMinutes', Number(event.target.value))} className="min-h-11 w-full rounded-md border border-gray-200 bg-white px-3 outline-none focus:border-brand-orange"><option value={15}>15 minutes before</option><option value={30}>30 minutes before</option><option value={60}>1 hour before</option><option value={1440}>1 day before</option></select></label>
              <Toggle checked={preferences.quietHoursEnabled} label="Use quiet hours" onChange={(value) => updatePreference('quietHoursEnabled', value)} />
              {preferences.quietHoursEnabled ? <div className="grid grid-cols-2 gap-3"><label className="space-y-2"><span className="text-sm font-semibold text-gray-700">From</span><input type="time" value={preferences.quietHoursStart} onChange={(event) => updatePreference('quietHoursStart', event.target.value)} className="min-h-11 w-full rounded-md border border-gray-200 px-3 outline-none focus:border-brand-orange" /></label><label className="space-y-2"><span className="text-sm font-semibold text-gray-700">Until</span><input type="time" value={preferences.quietHoursEnd} onChange={(event) => updatePreference('quietHoursEnd', event.target.value)} className="min-h-11 w-full rounded-md border border-gray-200 px-3 outline-none focus:border-brand-orange" /></label></div> : null}
            </div>
          </div>

          {notificationMessage ? <p className="mt-5 rounded-md bg-gray-50 p-3 text-sm text-gray-600">{notificationMessage}</p> : null}
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            {permission !== 'granted' ? <Button type="button" onClick={enableNotifications} disabled={permission === 'unsupported'}><BellRing size={17} />Enable phone notifications</Button> : <Button type="button" onClick={sendTestNotification}><BellRing size={17} />Send test notification</Button>}
            {permission === 'granted' && isServerPushConfigured() ? (
              serverPushConnected
                ? <Button type="button" variant="secondary" disabled={pushBusy} onClick={disconnectPush}>Pause server reminders</Button>
                : <Button type="button" variant="secondary" disabled={pushBusy} onClick={connectPush}>{pushBusy ? 'Connecting...' : 'Connect server push'}</Button>
            ) : null}
          </div>
          <p className="mt-4 text-xs leading-5 text-gray-400">Sound follows your phone notification volume and silent mode. Server reminders can arrive while ENs is closed after this phone is connected.</p>
        </article>
      </section>
    </div>
  );
}
