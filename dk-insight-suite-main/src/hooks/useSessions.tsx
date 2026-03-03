import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Database } from '@/integrations/supabase/types';

type SessionRow = Database['public']['Tables']['sessions']['Row'];

export interface SessionWithDevice extends SessionRow {
  devices?: {
    hostname: string;
    device_type: string | null;
  } | null;
  profiles?: {
    display_name: string | null;
    email: string;
  } | null;
}

export function useSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionWithDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // First fetch sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .order('session_start', { ascending: false, nullsFirst: false })
        .limit(100);

      if (sessionsError) throw sessionsError;

      if (!sessionsData || sessionsData.length === 0) {
        setSessions([]);
        setLoading(false);
        return;
      }

      // Then fetch device info for these sessions
      const deviceIds = [...new Set(sessionsData.map(s => s.device_id))];
      const { data: devices } = await supabase
        .from('devices')
        .select('id, hostname, device_type, assigned_user_id')
        .in('id', deviceIds);

      const devicesMap: Record<string, { hostname: string; device_type: string | null; assigned_user_id: string | null }> = {};
      devices?.forEach(d => {
        devicesMap[d.id] = { hostname: d.hostname, device_type: d.device_type, assigned_user_id: d.assigned_user_id };
      });

      // Fetch profiles for assigned users
      const userIds = devices?.filter(d => d.assigned_user_id).map(d => d.assigned_user_id) || [];
      let profilesMap: Record<string, { display_name: string | null; email: string }> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, email')
          .in('user_id', userIds);

        profiles?.forEach(p => {
          profilesMap[p.user_id] = { display_name: p.display_name, email: p.email };
        });
      }

      const sessionsWithData: SessionWithDevice[] = sessionsData.map(session => {
        const device = devicesMap[session.device_id];
        const profile = device?.assigned_user_id ? profilesMap[device.assigned_user_id] : null;
        
        return {
          ...session,
          devices: device ? { hostname: device.hostname, device_type: device.device_type } : null,
          profiles: profile,
        };
      });

      setSessions(sessionsWithData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [user]);

  return { sessions, loading, error, refetch: fetchSessions };
}
