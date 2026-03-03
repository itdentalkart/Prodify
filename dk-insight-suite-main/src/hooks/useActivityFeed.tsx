import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Database } from '@/integrations/supabase/types';

type TelemetryRow = Database['public']['Tables']['telemetry_events']['Row'];

export interface ActivityEvent {
  id: string;
  eventType: string;
  eventTime: Date;
  deviceId: string | null;
  deviceHostname?: string;
  details: Record<string, any>;
}

export function useActivityFeed(limit: number = 20) {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = async () => {
    if (!user) return;

    try {
      // Fetch recent telemetry events
      const { data: events, error } = await supabase
        .from('telemetry_events')
        .select('*')
        .order('event_time', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Get device hostnames for the events
      const deviceIds = [...new Set(events?.filter(e => e.device_id).map(e => e.device_id) || [])];
      
      let deviceMap: Record<string, string> = {};
      if (deviceIds.length > 0) {
        const { data: devices } = await supabase
          .from('devices')
          .select('id, hostname')
          .in('id', deviceIds);
        
        deviceMap = (devices || []).reduce((acc, d) => {
          acc[d.id] = d.hostname;
          return acc;
        }, {} as Record<string, string>);
      }

      const formattedActivities: ActivityEvent[] = (events || []).map(event => ({
        id: event.id,
        eventType: event.event_type,
        eventTime: new Date(event.event_time || new Date()),
        deviceId: event.device_id,
        deviceHostname: event.device_id ? deviceMap[event.device_id] : undefined,
        details: (event.details as Record<string, any>) || {},
      }));

      setActivities(formattedActivities);
    } catch (err) {
      console.error('Error fetching activity feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();

    // Subscribe to realtime telemetry events
    const channel = supabase
      .channel('realtime-activity')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'telemetry_events',
        },
        (payload) => {
          console.log('New activity:', payload);
          fetchActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, limit]);

  return { activities, loading, refetch: fetchActivities };
}
