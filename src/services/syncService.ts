import type { Customer, FinanceTransaction, FollowUp, Goal, Invoice, Meeting, Project, QuickNote, Reminder, Task } from '../types';
import { getCurrentUserId } from './authService';
import { supabase } from './supabase';
import { requireActiveWorkspaceId } from './workspaceService';

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  return supabase;
}

async function requireUserId() {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('A signed-in user is required for cloud sync.');
  }

  return userId;
}

async function requireSyncContext() {
  const [userId, workspaceId] = await Promise.all([requireUserId(), requireActiveWorkspaceId()]);
  return { userId, workspaceId };
}

export async function loadCloudTasks(): Promise<Task[]> {
  const client = requireSupabase();
  const { userId, workspaceId } = await requireSyncContext(); void userId;

  const { data, error } = await client
    .from('tasks')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('due_date', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    priority: task.priority,
    status: task.status,
    dueDate: task.due_date,
    projectId: task.project_id ?? '',
    assignee: task.assignee,
    schedule: task.schedule,
    createdAt: task.created_at,
  }));
}

export async function saveCloudTask(task: Task) {
  const client = requireSupabase();
  const { userId, workspaceId } = await requireSyncContext(); void userId;

  const { error } = await client.from('tasks').upsert({
    id: task.id,
    user_id: userId, workspace_id: workspaceId,
    title: task.title,
    description: task.description,
    priority: task.priority,
    status: task.status,
    due_date: task.dueDate,
    project_id: task.projectId || null,
    assignee: task.assignee,
    schedule: task.schedule,
  });

  if (error) {
    throw error;
  }
}

export async function deleteCloudTask(taskId: string) {
  const client = requireSupabase();
  const { userId, workspaceId } = await requireSyncContext(); void userId;

  const { error } = await client.from('tasks').delete().eq('id', taskId).eq('workspace_id', workspaceId);
  if (error) {
    throw error;
  }
}

export async function loadCloudProjects(): Promise<Project[]> {
  const client = requireSupabase();
  const { userId, workspaceId } = await requireSyncContext(); void userId;

  const { data, error } = await client
    .from('projects')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('due_date', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((project) => ({
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status,
    progress: project.progress,
    totalTasks: project.total_tasks,
    completedTasks: project.completed_tasks,
    dueDate: project.due_date,
    owner: project.owner,
    client: project.client,
  }));
}

export async function saveCloudProject(project: Project) {
  const client = requireSupabase();
  const { userId, workspaceId } = await requireSyncContext(); void userId;

  const { error } = await client.from('projects').upsert({
    id: project.id,
    user_id: userId, workspace_id: workspaceId,
    name: project.name,
    description: project.description,
    status: project.status,
    progress: project.progress,
    total_tasks: project.totalTasks,
    completed_tasks: project.completedTasks,
    due_date: project.dueDate,
    owner: project.owner,
    client: project.client,
  });

  if (error) {
    throw error;
  }
}

export async function deleteCloudProject(projectId: string) {
  const client = requireSupabase();
  const { userId, workspaceId } = await requireSyncContext(); void userId;

  const { error } = await client.from('projects').delete().eq('id', projectId).eq('workspace_id', workspaceId);
  if (error) {
    throw error;
  }
}

export async function loadCloudCustomers(): Promise<Customer[]> {
  const client = requireSupabase();
  const { userId, workspaceId } = await requireSyncContext(); void userId;

  const { data, error } = await client
    .from('customers')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('next_follow_up', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((customer) => ({
    id: customer.id,
    name: customer.name,
    company: customer.company,
    email: customer.email,
    phone: customer.phone,
    status: customer.status,
    health: customer.health,
    owner: customer.owner,
    value: Number(customer.value),
    lastContact: customer.last_contact,
    nextFollowUp: customer.next_follow_up,
    notes: customer.notes,
  }));
}

export async function saveCloudCustomer(customer: Customer) {
  const client = requireSupabase();
  const { userId, workspaceId } = await requireSyncContext(); void userId;

  const { error } = await client.from('customers').upsert({
    id: customer.id,
    user_id: userId, workspace_id: workspaceId,
    name: customer.name,
    company: customer.company,
    email: customer.email,
    phone: customer.phone,
    status: customer.status,
    health: customer.health,
    owner: customer.owner,
    value: customer.value,
    last_contact: customer.lastContact,
    next_follow_up: customer.nextFollowUp,
    notes: customer.notes,
  });

  if (error) {
    throw error;
  }
}

export async function deleteCloudCustomer(customerId: string) {
  const client = requireSupabase();
  const { userId, workspaceId } = await requireSyncContext(); void userId;

  const { error } = await client.from('customers').delete().eq('id', customerId).eq('workspace_id', workspaceId);
  if (error) {
    throw error;
  }
}

export async function loadCloudFollowUps(): Promise<FollowUp[]> {
  const client = requireSupabase();
  const { userId, workspaceId } = await requireSyncContext(); void userId;

  const { data, error } = await client
    .from('follow_ups')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('due_date', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((followUp) => ({
    id: followUp.id,
    customerId: followUp.customer_id,
    customer: followUp.customer,
    note: followUp.note,
    dueDate: followUp.due_date,
    priority: followUp.priority,
    status: followUp.status,
    owner: followUp.owner,
    channel: followUp.channel,
    nextStep: followUp.next_step,
  }));
}

export async function saveCloudFollowUp(followUp: FollowUp) {
  const client = requireSupabase();
  const { userId, workspaceId } = await requireSyncContext(); void userId;

  const { error } = await client.from('follow_ups').upsert({
    id: followUp.id,
    user_id: userId, workspace_id: workspaceId,
    customer_id: followUp.customerId,
    customer: followUp.customer,
    note: followUp.note,
    due_date: followUp.dueDate,
    priority: followUp.priority,
    status: followUp.status,
    owner: followUp.owner,
    channel: followUp.channel,
    next_step: followUp.nextStep,
  });

  if (error) {
    throw error;
  }
}

export async function loadCloudNotes(): Promise<QuickNote[]> {
  const client = requireSupabase();
  const { userId, workspaceId } = await requireSyncContext(); void userId;

  const { data, error } = await client
    .from('notes')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((note) => ({
    id: note.id,
    title: note.title,
    body: note.body,
    updatedAt: note.updated_at.slice(0, 10),
    folder: note.folder ?? 'General',
    tags: note.tags ?? [],
    pinned: note.pinned ?? false,
    linkedType: note.linked_type ?? 'None',
    linkedId: note.linked_id ?? '',
  }));
}

export async function saveCloudNote(note: QuickNote) {
  const client = requireSupabase();
  const { userId, workspaceId } = await requireSyncContext(); void userId;

  const { error } = await client.from('notes').upsert({
    id: note.id,
    user_id: userId, workspace_id: workspaceId,
    title: note.title,
    body: note.body,
    folder: note.folder,
    tags: note.tags,
    pinned: note.pinned,
    linked_type: note.linkedType,
    linked_id: note.linkedId || null,
    updated_at: note.updatedAt,
  });

  if (error) {
    throw error;
  }
}

export async function deleteCloudNote(noteId: string) {
  const client = requireSupabase();
  const { userId, workspaceId } = await requireSyncContext(); void userId;

  const { error } = await client.from('notes').delete().eq('id', noteId).eq('workspace_id', workspaceId);
  if (error) {
    throw error;
  }
}

export async function loadCloudMeetings(): Promise<Meeting[]> {
  const client = requireSupabase();
  const { userId, workspaceId } = await requireSyncContext(); void userId;

  const { data, error } = await client
    .from('meetings')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('date', { ascending: true })
    .order('time', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((meeting) => ({
    id: meeting.id,
    title: meeting.title,
    date: meeting.date,
    time: meeting.time,
    attendees: meeting.attendees,
    location: meeting.location,
  }));
}

export async function saveCloudMeeting(meeting: Meeting) {
  const client = requireSupabase();
  const { userId, workspaceId } = await requireSyncContext(); void userId;

  const { error } = await client.from('meetings').upsert({
    id: meeting.id,
    user_id: userId, workspace_id: workspaceId,
    title: meeting.title,
    date: meeting.date,
    time: meeting.time,
    attendees: meeting.attendees,
    location: meeting.location,
  });

  if (error) {
    throw error;
  }
}

export async function deleteCloudMeeting(meetingId: string) {
  const client = requireSupabase();
  const { userId, workspaceId } = await requireSyncContext(); void userId;

  const { error } = await client.from('meetings').delete().eq('id', meetingId).eq('workspace_id', workspaceId);
  if (error) {
    throw error;
  }
}

export async function loadCloudGoals(): Promise<Goal[]> {
  const client = requireSupabase();
  const { userId, workspaceId } = await requireSyncContext(); void userId;

  const { data, error } = await client
    .from('goals')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((goal) => ({
    id: goal.id,
    title: goal.title,
    progress: goal.progress,
    owner: goal.owner,
    horizon: goal.horizon,
  }));
}

export async function saveCloudGoal(goal: Goal) {
  const client = requireSupabase();
  const { userId, workspaceId } = await requireSyncContext(); void userId;

  const { error } = await client.from('goals').upsert({
    id: goal.id,
    user_id: userId, workspace_id: workspaceId,
    title: goal.title,
    progress: goal.progress,
    owner: goal.owner,
    horizon: goal.horizon,
  });

  if (error) {
    throw error;
  }
}

export async function deleteCloudGoal(goalId: string) {
  const client = requireSupabase();
  const { userId, workspaceId } = await requireSyncContext(); void userId;

  const { error } = await client.from('goals').delete().eq('id', goalId).eq('workspace_id', workspaceId);
  if (error) {
    throw error;
  }
}

export async function loadCloudReminders(): Promise<Reminder[]> {
  const client = requireSupabase();
  const { userId, workspaceId } = await requireSyncContext(); void userId;
  const { data, error } = await client.from('reminders').select('*').eq('workspace_id', workspaceId).order('reminder_date').order('reminder_time');
  if (error) throw error;
  return (data ?? []).map((reminder) => ({
    id: reminder.id,
    title: reminder.title,
    notes: reminder.notes,
    category: reminder.category,
    priority: reminder.priority,
    date: reminder.reminder_date,
    time: String(reminder.reminder_time).slice(0, 5),
    repeat: reminder.repeat_interval,
    status: reminder.status,
    createdAt: reminder.created_at,
  }));
}

export async function saveCloudReminder(reminder: Reminder) {
  const client = requireSupabase();
  const { userId, workspaceId } = await requireSyncContext(); void userId;
  const { error } = await client.from('reminders').upsert({
    id: reminder.id, user_id: userId, workspace_id: workspaceId, title: reminder.title, notes: reminder.notes,
    category: reminder.category, priority: reminder.priority, reminder_date: reminder.date,
    reminder_time: reminder.time, repeat_interval: reminder.repeat, status: reminder.status,
  });
  if (error) throw error;
}

export async function deleteCloudReminder(reminderId: string) {
  const client = requireSupabase();
  const { userId, workspaceId } = await requireSyncContext(); void userId;
  const { error } = await client.from('reminders').delete().eq('id', reminderId).eq('workspace_id', workspaceId);
  if (error) throw error;
}

export async function loadCloudTransactions(): Promise<FinanceTransaction[]> {
  const client = requireSupabase(); const { userId, workspaceId } = await requireSyncContext(); void userId;
  const { data, error } = await client.from('finance_transactions').select('*').eq('workspace_id', workspaceId).order('transaction_date', { ascending: false }).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((item) => ({ id: item.id, type: item.type, description: item.description, category: item.category, amount: Number(item.amount), date: item.transaction_date, paymentMethod: item.payment_method, reference: item.reference, createdAt: item.created_at }));
}

export async function saveCloudTransaction(item: FinanceTransaction) {
  const client = requireSupabase(); const { userId, workspaceId } = await requireSyncContext(); void userId;
  const { error } = await client.from('finance_transactions').upsert({ id: item.id, user_id: userId, workspace_id: workspaceId, type: item.type, description: item.description, category: item.category, amount: item.amount, transaction_date: item.date, payment_method: item.paymentMethod, reference: item.reference });
  if (error) throw error;
}

export async function deleteCloudTransaction(id: string) {
  const client = requireSupabase(); const { userId, workspaceId } = await requireSyncContext(); void userId;
  const { error } = await client.from('finance_transactions').delete().eq('id', id).eq('workspace_id', workspaceId); if (error) throw error;
}

export async function loadCloudInvoices(): Promise<Invoice[]> {
  const client = requireSupabase(); const { userId, workspaceId } = await requireSyncContext(); void userId;
  const { data, error } = await client.from('invoices').select('*').eq('workspace_id', workspaceId).order('due_date').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((item) => ({ id: item.id, invoiceNumber: item.invoice_number, customerId: item.customer_id ?? '', customerName: item.customer_name, description: item.description, amount: Number(item.amount), issueDate: item.issue_date, dueDate: item.due_date, status: item.status, createdAt: item.created_at }));
}

export async function saveCloudInvoice(item: Invoice) {
  const client = requireSupabase(); const { userId, workspaceId } = await requireSyncContext(); void userId;
  const { error } = await client.from('invoices').upsert({ id: item.id, user_id: userId, workspace_id: workspaceId, invoice_number: item.invoiceNumber, customer_id: item.customerId || null, customer_name: item.customerName, description: item.description, amount: item.amount, issue_date: item.issueDate, due_date: item.dueDate, status: item.status });
  if (error) throw error;
}

export async function deleteCloudInvoice(id: string) {
  const client = requireSupabase(); const { userId, workspaceId } = await requireSyncContext(); void userId;
  const { error } = await client.from('invoices').delete().eq('id', id).eq('workspace_id', workspaceId); if (error) throw error;
}
