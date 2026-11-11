import { supabase } from './supabase';

export interface PlatformWorkspaceSummary {
  workspaceId: string; name: string; type: string; country: string; industry: string; plan: string;
  subscriptionStatus: string; trialEndsAt: string; currentPeriodEnd: string; memberCount: number;
  ownerName: string; ownerEmail: string; createdAt: string;
}

export async function checkPlatformAdmin() {
  if (!supabase) return false;
  const { data, error } = await supabase.rpc('is_platform_admin');
  if (error) return false;
  return Boolean(data);
}

export async function loadPlatformWorkspaces(): Promise<PlatformWorkspaceSummary[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('platform_admin_workspace_summary');
  if (error) throw error;
  return (data ?? []).map((item) => ({ workspaceId: item.workspace_id, name: item.name, type: item.workspace_type, country: item.country, industry: item.industry, plan: item.plan_code, subscriptionStatus: item.subscription_status, trialEndsAt: item.trial_ends_at, currentPeriodEnd: item.current_period_end, memberCount: item.member_count, ownerName: item.owner_name, ownerEmail: item.owner_email, createdAt: item.created_at }));
}
