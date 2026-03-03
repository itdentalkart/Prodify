import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Database } from '@/integrations/supabase/types';

type DeviceRow = Database['public']['Tables']['devices']['Row'];

export interface DeviceWithUser extends DeviceRow {
  profiles?: {
    display_name: string | null;
    email: string;
  } | null;
}

export function useDevices() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<DeviceWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // First fetch devices
      const { data: devicesData, error: devicesError } = await supabase
        .from('devices')
        .select('*')
        .order('last_seen', { ascending: false, nullsFirst: false });

      if (devicesError) throw devicesError;

      // Then fetch profiles for assigned users
      const userIds = devicesData
        ?.filter(d => d.assigned_user_id)
        .map(d => d.assigned_user_id) || [];

      let profilesMap: Record<string, { display_name: string | null; email: string }> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, email')
          .in('user_id', userIds);

        profilesMap = (profiles || []).reduce((acc, p) => {
          acc[p.user_id] = { display_name: p.display_name, email: p.email };
          return acc;
        }, {} as Record<string, { display_name: string | null; email: string }>);
      }

      const devicesWithProfiles: DeviceWithUser[] = (devicesData || []).map(device => ({
        ...device,
        profiles: device.assigned_user_id ? profilesMap[device.assigned_user_id] || null : null,
      }));

      setDevices(devicesWithProfiles);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('devices-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'devices',
        },
        () => {
          fetchDevices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { devices, loading, error, refetch: fetchDevices };
}
