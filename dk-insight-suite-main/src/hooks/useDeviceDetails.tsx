import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Database } from '@/integrations/supabase/types';

type DeviceRow = Database['public']['Tables']['devices']['Row'];
type SessionRow = Database['public']['Tables']['sessions']['Row'];
type ScreenshotRow = Database['public']['Tables']['screenshots']['Row'];
type TelemetryRow = Database['public']['Tables']['telemetry_events']['Row'];

export interface DeviceDetails extends DeviceRow {
  profiles?: {
    display_name: string | null;
    email: string;
  } | null;
}

export interface DeviceSession extends SessionRow {
  profiles?: {
    display_name: string | null;
    email: string;
  } | null;
}

export interface DeviceScreenshot extends ScreenshotRow {
  signedUrl?: string | null;
}

export function useDeviceDetails(deviceId: string | undefined) {
  const { user } = useAuth();
  const [device, setDevice] = useState<DeviceDetails | null>(null);
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [screenshots, setScreenshots] = useState<DeviceScreenshot[]>([]);
  const [telemetry, setTelemetry] = useState<TelemetryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDeviceDetails = async () => {
    if (!user || !deviceId) return;
    
    setLoading(true);
    try {
      // Fetch device details
      const { data: deviceData, error: deviceError } = await supabase
        .from('devices')
        .select('*')
        .eq('id', deviceId)
        .maybeSingle();

      if (deviceError) throw deviceError;
      if (!deviceData) {
        setError('Device not found');
        return;
      }

      // Fetch assigned user profile if exists
      let deviceWithProfile: DeviceDetails = deviceData;
      if (deviceData.assigned_user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, email')
          .eq('user_id', deviceData.assigned_user_id)
          .maybeSingle();
        
        deviceWithProfile = {
          ...deviceData,
          profiles: profile,
        };
      }

      setDevice(deviceWithProfile);

      // Fetch sessions for this device
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .eq('device_id', deviceId)
        .order('session_start', { ascending: false })
        .limit(50);

      if (sessionsError) throw sessionsError;

      // Fetch profiles for session users
      const userIds = sessionsData?.filter(s => s.user_id).map(s => s.user_id) || [];
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

      const sessionsWithProfiles: DeviceSession[] = (sessionsData || []).map(session => ({
        ...session,
        profiles: session.user_id ? profilesMap[session.user_id] || null : null,
      }));

      setSessions(sessionsWithProfiles);

      // Fetch screenshots for this device
      const { data: screenshotsData, error: screenshotsError } = await supabase
        .from('screenshots')
        .select('*')
        .eq('device_id', deviceId)
        .order('captured_at', { ascending: false })
        .limit(50);

      if (screenshotsError) throw screenshotsError;
      setScreenshots(screenshotsData || []);

      // Fetch telemetry events for this device
      const { data: telemetryData, error: telemetryError } = await supabase
        .from('telemetry_events')
        .select('*')
        .eq('device_id', deviceId)
        .order('event_time', { ascending: false })
        .limit(100);

      if (telemetryError) throw telemetryError;
      setTelemetry(telemetryData || []);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getScreenshotUrl = async (filePath: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from('screenshots')
        .createSignedUrl(filePath, 3600);
      
      if (error) throw error;
      return data?.signedUrl || null;
    } catch (err) {
      console.error('Error getting signed URL:', err);
      return null;
    }
  };

  useEffect(() => {
    fetchDeviceDetails();

    if (!deviceId) return;

    // Subscribe to realtime changes for device
    const deviceChannel = supabase
      .channel(`device-${deviceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'devices',
          filter: `id=eq.${deviceId}`,
        },
        () => {
          fetchDeviceDetails();
        }
      )
      .subscribe();

    // Subscribe to realtime changes for sessions
    const sessionsChannel = supabase
      .channel(`device-sessions-${deviceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions',
          filter: `device_id=eq.${deviceId}`,
        },
        () => {
          fetchDeviceDetails();
        }
      )
      .subscribe();

    // Subscribe to realtime changes for screenshots
    const screenshotsChannel = supabase
      .channel(`device-screenshots-${deviceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'screenshots',
          filter: `device_id=eq.${deviceId}`,
        },
        () => {
          fetchDeviceDetails();
        }
      )
      .subscribe();

    // Subscribe to realtime changes for telemetry
    const telemetryChannel = supabase
      .channel(`device-telemetry-${deviceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'telemetry_events',
          filter: `device_id=eq.${deviceId}`,
        },
        () => {
          fetchDeviceDetails();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(deviceChannel);
      supabase.removeChannel(sessionsChannel);
      supabase.removeChannel(screenshotsChannel);
      supabase.removeChannel(telemetryChannel);
    };
  }, [user, deviceId]);

  return { 
    device, 
    sessions, 
    screenshots, 
    telemetry, 
    loading, 
    error, 
    refetch: fetchDeviceDetails,
    getScreenshotUrl 
  };
}
