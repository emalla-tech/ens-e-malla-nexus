import type { FollowUp, Task } from '../types';
import { getCurrentUserId } from './authService';
import { supabase } from './supabase';

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

export async function loadCloudTasks(): Promise<Task[]> {
  const client = requireSupabase();
  const userId = await requireUserId();

  const { data, error } = await client
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('due_date', { ascending: true });

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
    createdAt: task.created_at.slice(0, 10),
  }));
}

export async function saveCloudTask(task: Task) {
  const client = requireSupabase();
  const userId = await requireUserId();

  const { error } = await client.from('tasks').upsert({
    id: task.id,
    user_id: userId,
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
  const userId = await requireUserId();

  const { error } = await client.from('tasks').delete().eq('id', taskId).eq('user_id', userId);
  if (error) {
    throw error;
  }
}

export async function loadCloudFollowUps(): Promise<FollowUp[]> {
  const client = requireSupabase();
  const userId = await requireUserId();

  const { data, error } = await client
    .from('follow_ups')
    .select('*')
    .eq('user_id', userId)
    .order('due_date', { ascending: true });

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
  const userId = await requireUserId();

  const { error } = await client.from('follow_ups').upsert({
    id: followUp.id,
    user_id: userId,
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
