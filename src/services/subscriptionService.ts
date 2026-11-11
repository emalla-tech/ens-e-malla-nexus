import { getPlan } from '../data/planCatalog';
import type { Json } from '../types/database';
import type { PlanCode, WorkspaceSubscription, WorkspaceUsage } from '../types';
import { getCurrentUserId } from './authService';
import { supabase } from './supabase';

export async function loadSubscription(workspaceId: string, fallbackPlan: PlanCode): Promise<WorkspaceSubscription> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.from('workspace_subscriptions').select('*').eq('workspace_id', workspaceId).maybeSingle();
  if (error) throw error;
  if (!data) return { id: '', workspaceId, planCode: fallbackPlan, status: 'Active', trialEndsAt: '', currentPeriodEnd: '', cancelAtPeriodEnd: false };
  return { id: data.id, workspaceId: data.workspace_id, planCode: data.plan_code, status: data.status, trialEndsAt: data.trial_ends_at, currentPeriodEnd: data.current_period_end, cancelAtPeriodEnd: data.cancel_at_period_end };
}

export async function loadWorkspaceUsage(workspaceId: string): Promise<WorkspaceUsage> {
  if (!supabase) return { members: 0, customers: 0, projects: 0, storageMb: 0 };
  const { data, error } = await supabase.rpc('workspace_usage_summary', { target_workspace: workspaceId });
  if (error) throw error;
  const usage = (data ?? {}) as Json as Record<string, number>;
  return { members: Number(usage.members ?? 0), customers: Number(usage.customers ?? 0), projects: Number(usage.projects ?? 0), storageMb: Number(usage.storage_mb ?? 0) };
}

export async function requestPlanChange(workspaceId: string, planCode: PlanCode) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const userId = await getCurrentUserId(); if (!userId) throw new Error('Sign in first.');
  const { error } = await supabase.from('subscription_change_requests').insert({ workspace_id: workspaceId, requested_plan: planCode, requested_by: userId });
  if (error) throw error;
  return getPlan(planCode);
}
