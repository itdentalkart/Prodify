import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface DashboardMetrics {
  totalDevices: number;
  onlineDevices: number;
  idleDevices: number;
  offlineDevices: number;
  totalSessions: number;
  screenshotCount: number;
  totalActiveTime: number;
  totalIdleTime: number;
}

export function useDashboardData() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalDevices: 0,
    onlineDevices: 0,
    idleDevices: 0,
    offlineDevices: 0,
    totalSessions: 0,
    screenshotCount: 0,
    totalActiveTime: 0,
    totalIdleTime: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    if (!user) return;

    try {
      // Fetch devices
      const { data: devices } = await supabase
        .from('devices')
        .select('status');

      const totalDevices = devices?.length || 0;
      const onlineDevices = devices?.filter(d => d.status === 'online').length || 0;
      const idleDevices = devices?.filter(d => d.status === 'idle').length || 0;
      const offlineDevices = devices?.filter(d => d.status === 'offline').length || 0;

      // Fetch today's sessions
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: sessions } = await supabase
        .from('sessions')
        .select('active_seconds, idle_seconds')
        .gte('session_start', today.toISOString());

      const totalSessions = sessions?.length || 0;
      const totalActiveTime = sessions?.reduce((acc, s) => acc + (s.active_seconds || 0), 0) || 0;
      const totalIdleTime = sessions?.reduce((acc, s) => acc + (s.idle_seconds || 0), 0) || 0;

      // Fetch today's screenshots count
      const { count: screenshotCount } = await supabase
        .from('screenshots')
        .select('*', { count: 'exact', head: true })
        .gte('captured_at', today.toISOString());

      setMetrics({
        totalDevices,
        onlineDevices,
        idleDevices,
        offlineDevices,
        totalSessions,
        screenshotCount: screenshotCount || 0,
        totalActiveTime,
        totalIdleTime,
      });
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();

    // Refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);

    return () => clearInterval(interval);
  }, [user]);

  return { metrics, loading, refetch: fetchMetrics };
}
