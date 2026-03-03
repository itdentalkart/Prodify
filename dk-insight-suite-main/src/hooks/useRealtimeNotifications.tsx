import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';
import { useBrowserNotifications } from './useBrowserNotifications';
import { useNotificationSound } from './useNotificationSound';
import { useInAppNotificationSettings } from './useInAppNotificationSettings';

export function useRealtimeNotifications() {
  const { toast } = useToast();
  const { user } = useAuth();
  const initializedRef = useRef(false);
  const { showNotification, permission } = useBrowserNotifications();
  const { playSound } = useNotificationSound();
  const { settings } = useInAppNotificationSettings();

  // Memoize the notify function to handle all notification types
  const notify = useCallback((title: string, description: string, icon?: string) => {
    // Show in-app toast
    toast({
      title: icon ? `${icon} ${title}` : title,
      description,
    });

    // Play sound if enabled
    if (settings.soundEnabled) {
      playSound();
    }

    // Show browser notification if enabled and permission granted
    if (settings.browserNotificationsEnabled && permission === 'granted') {
      showNotification(title, {
        body: description,
        tag: `notification-${Date.now()}`,
      });
    }
  }, [toast, settings.soundEnabled, settings.browserNotificationsEnabled, playSound, showNotification, permission]);

  useEffect(() => {
    if (!user || initializedRef.current) return;
    if (!settings.realtimeEnabled) return;
    
    initializedRef.current = true;

    // Subscribe to new device enrollments
    const devicesChannel = supabase
      .channel('devices-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'devices',
        },
        (payload) => {
          const device = payload.new as any;
          notify(
            'New Device Enrolled',
            `${device.hostname || 'Unknown device'} has been enrolled successfully.`,
            '🖥️'
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'devices',
        },
        (payload) => {
          const oldDevice = payload.old as any;
          const newDevice = payload.new as any;
          
          // Notify on status changes
          if (oldDevice.status !== newDevice.status) {
            const statusEmoji = newDevice.status === 'online' ? '🟢' : newDevice.status === 'idle' ? '🟡' : '🔴';
            notify(
              'Device Status Changed',
              `${newDevice.hostname} is now ${newDevice.status}.`,
              statusEmoji
            );
          }
        }
      )
      .subscribe();

    // Subscribe to new screenshots
    const screenshotsChannel = supabase
      .channel('screenshots-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'screenshots',
        },
        (payload) => {
          notify(
            'New Screenshot Captured',
            'A new screenshot has been captured.',
            '📸'
          );
        }
      )
      .subscribe();

    // Subscribe to enrollment token usage
    const tokensChannel = supabase
      .channel('tokens-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'enrollment_tokens',
        },
        (payload) => {
          const oldToken = payload.old as any;
          const newToken = payload.new as any;
          
          // Notify when a token is used
          if (!oldToken.used_at && newToken.used_at) {
            notify(
              'Enrollment Token Used',
              `Token ${newToken.token.substring(0, 8)}... was used to enroll a device.`,
              '🔑'
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(devicesChannel);
      supabase.removeChannel(screenshotsChannel);
      supabase.removeChannel(tokensChannel);
    };
  }, [user, notify, settings.realtimeEnabled]);
}
