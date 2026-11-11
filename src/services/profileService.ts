import { supabase } from './supabase';

export interface UserProfile {
  fullName: string;
  jobTitle: string;
}

export async function loadCurrentProfile(): Promise<UserProfile> {
  if (!supabase) return { fullName: 'User', jobTitle: '' };
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) throw authError ?? new Error('Sign in first.');
  const { data, error } = await supabase.from('profiles').select('full_name, role').eq('id', authData.user.id).maybeSingle();
  if (error) throw error;
  const metadataName = typeof authData.user.user_metadata.full_name === 'string' ? authData.user.user_metadata.full_name : '';
  return {
    fullName: data?.full_name?.trim() || metadataName.trim() || authData.user.email?.split('@')[0] || 'User',
    jobTitle: data?.role?.trim() || '',
  };
}

export async function saveCurrentProfile(profile: UserProfile) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) throw authError ?? new Error('Sign in first.');
  const cleanProfile = { fullName: profile.fullName.trim(), jobTitle: profile.jobTitle.trim() };
  if (!cleanProfile.fullName) throw new Error('Full name is required.');
  const { error } = await supabase.from('profiles').upsert({ id: authData.user.id, full_name: cleanProfile.fullName, role: cleanProfile.jobTitle || null, updated_at: new Date().toISOString() });
  if (error) throw error;
  const { error: metadataError } = await supabase.auth.updateUser({ data: { ...authData.user.user_metadata, full_name: cleanProfile.fullName } });
  if (metadataError) throw metadataError;
  return cleanProfile;
}
