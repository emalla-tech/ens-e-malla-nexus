import type { Workspace, WorkspaceMember, WorkspaceRole } from '../types';
import { getCurrentUserId } from './authService';
import { supabase } from './supabase';

const storageKey = 'ens.active-workspace.v1';
export function getStoredWorkspaceId() { return window.localStorage.getItem(storageKey) ?? ''; }
export function storeWorkspaceId(id: string) { window.localStorage.setItem(storageKey, id); }

export async function loadWorkspaces(): Promise<Workspace[]> {
  if (!supabase) return [];
  const userId = await getCurrentUserId(); if (!userId) return [];
  await supabase.rpc('claim_workspace_invitations');
  const { data: memberships, error } = await supabase.from('workspace_members').select('*').eq('user_id', userId).eq('status', 'Active');
  if (error) throw error;
  const ids = (memberships ?? []).map((item) => item.workspace_id); if (!ids.length) return [];
  const { data: workspaces, error: workspaceError } = await supabase.from('workspaces').select('*').in('id', ids);
  if (workspaceError) throw workspaceError;
  return (workspaces ?? []).map((workspace) => ({ id: workspace.id, name: workspace.name, slug: workspace.slug, type: workspace.type, ownerId: workspace.owner_id, currency: workspace.currency, timezone: workspace.timezone, country: workspace.country ?? 'RW', industry: workspace.industry ?? '', enabledModules: workspace.enabled_modules ?? [], plan: workspace.plan ?? 'Personal', onboardingComplete: workspace.onboarding_complete ?? true, trialEndsAt: workspace.trial_ends_at ?? '', role: memberships?.find((item) => item.workspace_id === workspace.id)?.role ?? 'Member' }));
}

export interface WorkspaceSetup { name: string; type: 'Personal' | 'Company'; country: string; currency: string; timezone: string; industry: string; enabledModules: string[]; plan: 'Personal' | 'Business' | 'Professional'; }

export async function completeWorkspaceSetup(workspaceId: string, setup: WorkspaceSetup) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const slug = `${setup.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${workspaceId.slice(0, 6)}`;
  const { error } = await supabase.from('workspaces').update({ name: setup.name, slug, type: setup.type, country: setup.country, currency: setup.currency, timezone: setup.timezone, industry: setup.industry, enabled_modules: setup.enabledModules, plan: setup.plan, onboarding_complete: true }).eq('id', workspaceId);
  if (error) throw error;
}

export async function createWorkspace(setup: WorkspaceSetup) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.rpc('create_workspace', { workspace_name: setup.name, workspace_type: setup.type, workspace_country: setup.country, workspace_currency: setup.currency, workspace_timezone: setup.timezone, workspace_industry: setup.industry, workspace_modules: setup.enabledModules, workspace_plan: setup.plan });
  if (error) throw error;
  storeWorkspaceId(data); return data;
}

export async function requireActiveWorkspaceId() {
  const workspaces = await loadWorkspaces();
  const stored = getStoredWorkspaceId();
  const active = workspaces.find((item) => item.id === stored) ?? workspaces[0];
  if (!active) throw new Error('No active workspace is available.');
  storeWorkspaceId(active.id); return active.id;
}

export async function loadWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('workspace_member_directory').select('*').eq('workspace_id', workspaceId).order('joined_at');
  if (error) throw error;
  return (data ?? []).map((item) => ({ id: item.id, userId: item.user_id, fullName: item.full_name, email: item.email, role: item.role, joinedAt: item.joined_at }));
}

export async function inviteWorkspaceMember(workspaceId: string, email: string, role: Exclude<WorkspaceRole, 'Owner'>) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const userId = await getCurrentUserId(); if (!userId) throw new Error('Sign in first.');
  const { error } = await supabase.from('workspace_invitations').insert({ workspace_id: workspaceId, email: email.trim().toLowerCase(), role, invited_by: userId });
  if (error) throw error;
}

export async function updateWorkspaceMemberRole(memberId: string, role: Exclude<WorkspaceRole, 'Owner'>) { if (!supabase) return; const { error } = await supabase.from('workspace_members').update({ role }).eq('id', memberId); if (error) throw error; }
export async function removeWorkspaceMember(memberId: string) { if (!supabase) return; const { error } = await supabase.from('workspace_members').delete().eq('id', memberId).neq('role', 'Owner'); if (error) throw error; }
