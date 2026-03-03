import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface ScreenshotWithDevice {
  id: string;
  device_id: string;
  file_path: string;
  captured_at: string;
  session_id: string | null;
  org_id: string | null;
  device_hostname: string;
  device_location: string | null;
}

export function useScreenshots() {
  const [screenshots, setScreenshots] = useState<ScreenshotWithDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null,
  });
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchScreenshots = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch screenshots with device info
      const { data: screenshotsData, error: screenshotsError } = await supabase
        .from('screenshots')
        .select('*')
        .order('captured_at', { ascending: false })
        .limit(500);

      if (screenshotsError) throw screenshotsError;

      // Fetch devices for hostname info
      const { data: devices, error: devicesError } = await supabase
        .from('devices')
        .select('id, hostname, location');

      if (devicesError) throw devicesError;

      const devicesMap = new Map(devices?.map(d => [d.id, d]) || []);

      // Combine data
      const screenshotsWithDevices: ScreenshotWithDevice[] = (screenshotsData || []).map(ss => {
        const device = devicesMap.get(ss.device_id);
        return {
          id: ss.id,
          device_id: ss.device_id,
          file_path: ss.file_path,
          captured_at: ss.captured_at,
          session_id: ss.session_id,
          org_id: ss.org_id,
          device_hostname: device?.hostname || 'Unknown',
          device_location: device?.location || null,
        };
      });

      setScreenshots(screenshotsWithDevices);
    } catch (error: any) {
      console.error('Error fetching screenshots:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch screenshots',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Get unique devices from screenshots
  const devices = useMemo(() => {
    const deviceMap = new Map<string, string>();
    screenshots.forEach(ss => {
      deviceMap.set(ss.device_id, ss.device_hostname);
    });
    return Array.from(deviceMap.entries()).map(([id, hostname]) => ({ id, hostname }));
  }, [screenshots]);

  // Filtered screenshots
  const filteredScreenshots = useMemo(() => {
    return screenshots.filter(ss => {
      // Device filter
      if (selectedDevice !== 'all' && ss.device_id !== selectedDevice) {
        return false;
      }
      
      // Date filter
      const capturedAt = new Date(ss.captured_at);
      if (dateRange.from && capturedAt < dateRange.from) {
        return false;
      }
      if (dateRange.to) {
        const endOfDay = new Date(dateRange.to);
        endOfDay.setHours(23, 59, 59, 999);
        if (capturedAt > endOfDay) {
          return false;
        }
      }
      
      return true;
    });
  }, [screenshots, selectedDevice, dateRange]);

  // Get signed URL for screenshot
  const getScreenshotUrl = async (filePath: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from('screenshots')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('Error getting screenshot URL:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchScreenshots();
  }, [user]);

  return {
    screenshots: filteredScreenshots,
    allScreenshots: screenshots,
    loading,
    devices,
    selectedDevice,
    setSelectedDevice,
    dateRange,
    setDateRange,
    fetchScreenshots,
    getScreenshotUrl,
  };
}
