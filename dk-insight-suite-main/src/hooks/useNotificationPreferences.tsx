import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface NotificationPreferences {
  id?: string;
  org_id?: string;
  user_id?: string;
  device_offline_email: boolean;
  device_enrolled_email: boolean;
  screenshot_captured_email: boolean;
  token_used_email: boolean;
  weekly_report_email: boolean;
  offline_threshold_minutes: number;
}

const defaultPreferences: NotificationPreferences = {
  device_offline_email: true,
  device_enrolled_email: true,
  screenshot_captured_email: false,
  token_used_email: true,
  weekly_report_email: true,
  offline_threshold_minutes: 15,
};

export function useNotificationPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadPreferences();
    }
  }, [user?.id]);

  const loadPreferences = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading preferences:', error);
        return;
      }

      if (data) {
        setPreferences({
          id: data.id,
          org_id: data.org_id,
          user_id: data.user_id,
          device_offline_email: data.device_offline_email ?? true,
          device_enrolled_email: data.device_enrolled_email ?? true,
          screenshot_captured_email: data.screenshot_captured_email ?? false,
          token_used_email: data.token_used_email ?? true,
          weekly_report_email: data.weekly_report_email ?? true,
          offline_threshold_minutes: data.offline_threshold_minutes ?? 15,
        });
      }
    } catch (err) {
      console.error('Failed to load preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    if (!user?.id) return false;

    setSaving(true);
    try {
      const updatedPrefs = { ...preferences, ...newPreferences };
      
      // Get user's org_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.org_id) {
        toast.error('Could not find organization');
        return false;
      }

      const prefData = {
        user_id: user.id,
        org_id: profile.org_id,
        device_offline_email: updatedPrefs.device_offline_email,
        device_enrolled_email: updatedPrefs.device_enrolled_email,
        screenshot_captured_email: updatedPrefs.screenshot_captured_email,
        token_used_email: updatedPrefs.token_used_email,
        weekly_report_email: updatedPrefs.weekly_report_email,
        offline_threshold_minutes: updatedPrefs.offline_threshold_minutes,
      };

      if (preferences.id) {
        // Update existing
        const { error } = await supabase
          .from('notification_preferences')
          .update(prefData)
          .eq('id', preferences.id);

        if (error) throw error;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('notification_preferences')
          .insert(prefData)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setPreferences(prev => ({ ...prev, id: data.id, org_id: data.org_id }));
        }
      }

      setPreferences(updatedPrefs);
      toast.success('Notification preferences saved');
      return true;
    } catch (err: any) {
      console.error('Failed to save preferences:', err);
      toast.error('Failed to save preferences');
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    preferences,
    loading,
    saving,
    savePreferences,
    setPreferences,
  };
}
