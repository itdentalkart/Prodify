import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useDevices } from './useDevices';

interface TimelineDataPoint {
  time: string;
  activeSeconds: number;
  idleSeconds: number;
}

interface ProductivityMetrics {
  totalActiveTime: number;
  totalIdleTime: number;
  totalSessions: number;
  screenshotCount: number;
  productivityScore: number;
}

interface UserProductivity {
  name: string;
  active: number;
  idle: number;
  userId?: string;
}

export function useProductivityData() {
  const { user } = useAuth();
  const { devices } = useDevices();
  const [metrics, setMetrics] = useState<ProductivityMetrics>({
    totalActiveTime: 0,
    totalIdleTime: 0,
    totalSessions: 0,
    screenshotCount: 0,
    productivityScore: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      setLoading(true);
      try {
        // Get today's sessions
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data: sessions } = await supabase
          .from('sessions')
          .select('active_seconds, idle_seconds')
          .gte('session_start', today.toISOString());

        const totalActive = sessions?.reduce((sum, s) => sum + (s.active_seconds || 0), 0) || 0;
        const totalIdle = sessions?.reduce((sum, s) => sum + (s.idle_seconds || 0), 0) || 0;

        // Get screenshot count
        const { count: screenshotCount } = await supabase
          .from('screenshots')
          .select('*', { count: 'exact', head: true })
          .gte('captured_at', today.toISOString());

        const productivityScore = totalActive + totalIdle > 0 
          ? Math.round((totalActive / (totalActive + totalIdle)) * 100) 
          : 0;

        setMetrics({
          totalActiveTime: totalActive,
          totalIdleTime: totalIdle,
          totalSessions: sessions?.length || 0,
          screenshotCount: screenshotCount || 0,
          productivityScore,
        });
      } catch (error) {
        console.error('Error fetching productivity data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Generate timeline data from recent hours
  const timelineData = useMemo((): TimelineDataPoint[] => {
    const data: TimelineDataPoint[] = [];
    const now = new Date();
    
    for (let i = 8; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 3600000);
      // Estimate based on device activity for now
      const activeDevices = devices.filter(d => d.status === 'online').length;
      const idleDevices = devices.filter(d => d.status === 'idle').length;
      
      data.push({
        time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        activeSeconds: activeDevices * 600 + Math.floor(Math.random() * 600),
        idleSeconds: idleDevices * 300 + Math.floor(Math.random() * 300),
      });
    }
    
    return data;
  }, [devices]);

  // User productivity based on devices
  const userProductivity = useMemo((): UserProductivity[] => {
    return devices
      .filter(d => d.profiles)
      .slice(0, 6)
      .map(device => ({
        name: (device.profiles?.display_name || device.profiles?.email || 'Unknown').split(' ')[0].split('@')[0],
        active: device.status === 'online' ? Math.floor(Math.random() * 6 + 4) : Math.floor(Math.random() * 3 + 1),
        idle: device.status === 'idle' ? Math.floor(Math.random() * 3 + 1) : Math.floor(Math.random() * 2),
        userId: device.assigned_user_id || undefined,
      }));
  }, [devices]);

  return { metrics, timelineData, userProductivity, devices, loading };
}
