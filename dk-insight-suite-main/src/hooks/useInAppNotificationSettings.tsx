import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'inAppNotificationSettings';

interface InAppNotificationSettings {
  soundEnabled: boolean;
  browserNotificationsEnabled: boolean;
  realtimeEnabled: boolean;
}

const defaultSettings: InAppNotificationSettings = {
  soundEnabled: false,
  browserNotificationsEnabled: false,
  realtimeEnabled: true,
};

export function useInAppNotificationSettings() {
  const [settings, setSettingsState] = useState<InAppNotificationSettings>(defaultSettings);
  const [loaded, setLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettingsState({ ...defaultSettings, ...JSON.parse(stored) });
      }
    } catch {
      // Ignore parse errors
    }
    setLoaded(true);
  }, []);

  // Save settings to localStorage whenever they change
  const setSettings = useCallback((newSettings: Partial<InAppNotificationSettings>) => {
    setSettingsState(prev => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore storage errors
      }
      return updated;
    });
  }, []);

  return {
    settings,
    setSettings,
    loaded,
  };
}
