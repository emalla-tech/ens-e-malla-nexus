import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { checkPlatformAdmin } from '../services/platformAdminService';

export function usePlatformAdmin() {
  const { user } = useAuth();
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [loading, setLoading] = useState(Boolean(user));
  useEffect(() => {
    let active = true;
    if (!user) { setIsPlatformAdmin(false); setLoading(false); return undefined; }
    setLoading(true);
    void checkPlatformAdmin().then((allowed) => { if (active) setIsPlatformAdmin(allowed); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user]);
  return { isPlatformAdmin, loading };
}
