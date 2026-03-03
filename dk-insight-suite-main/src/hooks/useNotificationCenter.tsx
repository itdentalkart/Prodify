import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Notification {
  id: string;
  type: 'device_enrolled' | 'device_offline' | 'device_online' | 'screenshot' | 'token_used';
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
  icon: string;
}

export function useNotificationCenter() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load initial notifications from recent activity
  const loadNotifications = useCallback(async () => {
    if (!user) return;

    try {
      // Get recent devices (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { data: devices } = await supabase
        .from('devices')
        .select('id, hostname, status, created_at, last_seen')
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      // Get recent screenshots (last 24 hours)
      const { data: screenshots } = await supabase
        .from('screenshots')
        .select('id, captured_at, device_id')
        .gte('captured_at', yesterday.toISOString())
        .order('captured_at', { ascending: false })
        .limit(10);

      // Get recent token usage (last 24 hours)
      const { data: tokens } = await supabase
        .from('enrollment_tokens')
        .select('id, token, used_at')
        .not('used_at', 'is', null)
        .gte('used_at', yesterday.toISOString())
        .order('used_at', { ascending: false })
        .limit(5);

      const notifs: Notification[] = [];

      // Add device notifications
      devices?.forEach(device => {
        notifs.push({
          id: `device-${device.id}`,
          type: 'device_enrolled',
          title: 'New Device Enrolled',
          description: `${device.hostname} was enrolled`,
          timestamp: new Date(device.created_at!),
          read: false,
          icon: '🖥️',
        });
      });

      // Add screenshot notifications
      screenshots?.forEach(ss => {
        notifs.push({
          id: `screenshot-${ss.id}`,
          type: 'screenshot',
          title: 'Screenshot Captured',
          description: `New screenshot captured`,
          timestamp: new Date(ss.captured_at),
          read: false,
          icon: '📸',
        });
      });

      // Add token usage notifications
      tokens?.forEach(token => {
        notifs.push({
          id: `token-${token.id}`,
          type: 'token_used',
          title: 'Token Used',
          description: `Token ${token.token.substring(0, 8)}... was used`,
          timestamp: new Date(token.used_at!),
          read: false,
          icon: '🔑',
        });
      });

      // Sort by timestamp descending
      notifs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      setNotifications(notifs.slice(0, 20));
      setUnreadCount(notifs.length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    const devicesChannel = supabase
      .channel('notification-devices')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'devices' },
        (payload) => {
          const device = payload.new as any;
          const notif: Notification = {
            id: `device-${device.id}-${Date.now()}`,
            type: 'device_enrolled',
            title: 'New Device Enrolled',
            description: `${device.hostname} was enrolled`,
            timestamp: new Date(),
            read: false,
            icon: '🖥️',
          };
          setNotifications(prev => [notif, ...prev].slice(0, 20));
          setUnreadCount(prev => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'devices' },
        (payload) => {
          const oldDevice = payload.old as any;
          const newDevice = payload.new as any;
          
          if (oldDevice.status !== newDevice.status) {
            const isOffline = newDevice.status === 'offline';
            const notif: Notification = {
              id: `device-status-${newDevice.id}-${Date.now()}`,
              type: isOffline ? 'device_offline' : 'device_online',
              title: isOffline ? 'Device Went Offline' : 'Device Back Online',
              description: `${newDevice.hostname} is now ${newDevice.status}`,
              timestamp: new Date(),
              read: false,
              icon: isOffline ? '🔴' : '🟢',
            };
            setNotifications(prev => [notif, ...prev].slice(0, 20));
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    const screenshotsChannel = supabase
      .channel('notification-screenshots')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'screenshots' },
        () => {
          const notif: Notification = {
            id: `screenshot-${Date.now()}`,
            type: 'screenshot',
            title: 'Screenshot Captured',
            description: 'New screenshot captured',
            timestamp: new Date(),
            read: false,
            icon: '📸',
          };
          setNotifications(prev => [notif, ...prev].slice(0, 20));
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    const tokensChannel = supabase
      .channel('notification-tokens')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'enrollment_tokens' },
        (payload) => {
          const oldToken = payload.old as any;
          const newToken = payload.new as any;
          
          if (!oldToken.used_at && newToken.used_at) {
            const notif: Notification = {
              id: `token-${newToken.id}-${Date.now()}`,
              type: 'token_used',
              title: 'Token Used',
              description: `Token ${newToken.token.substring(0, 8)}... was used`,
              timestamp: new Date(),
              read: false,
              icon: '🔑',
            };
            setNotifications(prev => [notif, ...prev].slice(0, 20));
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(devicesChannel);
      supabase.removeChannel(screenshotsChannel);
      supabase.removeChannel(tokensChannel);
    };
  }, [user]);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    markAllAsRead,
    markAsRead,
    clearAll,
    refresh: loadNotifications,
  };
}