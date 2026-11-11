import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { loadCurrentProfile, saveCurrentProfile, type UserProfile } from '../services/profileService';

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({ fullName: '', jobTitle: '' });
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState('');
  const refresh = useCallback(() => {
    if (!user) { setProfile({ fullName: '', jobTitle: '' }); setLoading(false); return; }
    setLoading(true); setError('');
    void loadCurrentProfile().then(setProfile).catch((reason: unknown) => setError(typeof reason === 'object' && reason && 'message' in reason ? String(reason.message) : 'Profile could not be loaded.')).finally(() => setLoading(false));
  }, [user]);
  useEffect(refresh, [refresh]);
  async function save(nextProfile: UserProfile) { const saved = await saveCurrentProfile(nextProfile); setProfile(saved); return saved; }
  return { profile, loading, error, refresh, save };
}
