import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  Camera, 
  Clock, 
  Shield, 
  Database, 
  Bell,
  Save,
  RotateCcw,
  Mail,
  Loader2,
  Volume2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { useInAppNotificationSettings } from '@/hooks/useInAppNotificationSettings';
import { useBrowserNotifications } from '@/hooks/useBrowserNotifications';

export default function Settings() {
  const [screenshotInterval, setScreenshotInterval] = useState(5);
  const [idleThreshold, setIdleThreshold] = useState(5);
  const [retentionDays, setRetentionDays] = useState(30);
  const [workingHoursStart, setWorkingHoursStart] = useState('09:00');
  const [workingHoursEnd, setWorkingHoursEnd] = useState('18:00');
  const [autoDeleteEnabled, setAutoDeleteEnabled] = useState(true);

  const { 
    preferences, 
    loading: prefsLoading, 
    saving: prefsSaving, 
    savePreferences,
    setPreferences 
  } = useNotificationPreferences();

  const { settings: inAppSettings, setSettings: setInAppSettings } = useInAppNotificationSettings();
  const { permission, requestPermission, supported: browserNotificationsSupported } = useBrowserNotifications();

  const handleSave = async () => {
    const saved = await savePreferences(preferences);
    if (saved) {
      toast.success('Settings saved successfully');
    }
  };

  const handleResetDefaults = () => {
    setScreenshotInterval(5);
    setIdleThreshold(5);
    setRetentionDays(30);
    setWorkingHoursStart('09:00');
    setWorkingHoursEnd('18:00');
    setAutoDeleteEnabled(true);
    setPreferences({
      device_offline_email: true,
      device_enrolled_email: true,
      screenshot_captured_email: false,
      token_used_email: true,
      weekly_report_email: true,
      offline_threshold_minutes: 15,
    });
    setInAppSettings({
      soundEnabled: false,
      browserNotificationsEnabled: false,
      realtimeEnabled: true,
    });
    toast.info('Settings reset to defaults');
  };

  const handleBrowserNotificationToggle = async (checked: boolean) => {
    if (checked && permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) {
        toast.error('Browser notification permission denied. Please enable it in your browser settings.');
        return;
      }
    }
    setInAppSettings({ browserNotificationsEnabled: checked });
  };

  return (
    <MainLayout 
      title="Settings" 
      subtitle="Configure monitoring and system preferences"
    >
      <div className="space-y-6 animate-fade-in max-w-4xl">
        {/* Screenshot Settings */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-lg bg-primary/10 p-2">
              <Camera className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Screenshot Settings</h2>
              <p className="text-sm text-muted-foreground">Configure screenshot capture behavior</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Screenshot Interval</Label>
                <span className="text-sm font-medium text-primary">{screenshotInterval} minutes</span>
              </div>
              <Slider
                value={[screenshotInterval]}
                onValueChange={([v]) => setScreenshotInterval(v)}
                min={1}
                max={30}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                How often screenshots are captured during working hours
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Idle Detection Threshold</Label>
                <span className="text-sm font-medium text-warning">{idleThreshold} minutes</span>
              </div>
              <Slider
                value={[idleThreshold]}
                onValueChange={([v]) => setIdleThreshold(v)}
                min={1}
                max={30}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Time without input before marking user as idle
              </p>
            </div>
          </div>
        </div>

        {/* Working Hours */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-lg bg-info/10 p-2">
              <Clock className="h-5 w-5 text-info" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Working Hours</h2>
              <p className="text-sm text-muted-foreground">Define when monitoring is active</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="time"
                value={workingHoursStart}
                onChange={(e) => setWorkingHoursStart(e.target.value)}
                className="bg-secondary/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">End Time</Label>
              <Input
                id="end-time"
                type="time"
                value={workingHoursEnd}
                onChange={(e) => setWorkingHoursEnd(e.target.value)}
                className="bg-secondary/50"
              />
            </div>
          </div>
        </div>

        {/* Data Retention */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-lg bg-warning/10 p-2">
              <Database className="h-5 w-5 text-warning" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Data Retention</h2>
              <p className="text-sm text-muted-foreground">Manage screenshot storage and deletion</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Retention Period</Label>
                <span className="text-sm font-medium text-foreground">{retentionDays} days</span>
              </div>
              <Slider
                value={[retentionDays]}
                onValueChange={([v]) => setRetentionDays(v)}
                min={7}
                max={90}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Screenshots older than this will be automatically deleted
              </p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
              <div>
                <Label>Auto-Delete Expired Data</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Automatically remove data past retention period
                </p>
              </div>
              <Switch
                checked={autoDeleteEnabled}
                onCheckedChange={setAutoDeleteEnabled}
              />
            </div>
          </div>
        </div>

        {/* Email Notifications */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-lg bg-primary/10 p-2">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Email Notifications</h2>
              <p className="text-sm text-muted-foreground">Configure which alerts you receive via email</p>
            </div>
          </div>

          {prefsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                <div>
                  <Label>Device Offline Alerts</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Get notified when devices go offline for more than 15 minutes
                  </p>
                </div>
                <Switch
                  checked={preferences.device_offline_email}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, device_offline_email: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                <div>
                  <Label>Device Enrollment Alerts</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Get notified when new devices are enrolled
                  </p>
                </div>
                <Switch
                  checked={preferences.device_enrolled_email}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, device_enrolled_email: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                <div>
                  <Label>Screenshot Capture Alerts</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Get notified when screenshots are captured (high volume)
                  </p>
                </div>
                <Switch
                  checked={preferences.screenshot_captured_email}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, screenshot_captured_email: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                <div>
                  <Label>Token Usage Alerts</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Get notified when enrollment tokens are used
                  </p>
                </div>
                <Switch
                  checked={preferences.token_used_email}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, token_used_email: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                <div>
                  <Label>Weekly Reports</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Receive weekly productivity summaries
                  </p>
                </div>
                <Switch
                  checked={preferences.weekly_report_email}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, weekly_report_email: checked }))
                  }
                />
              </div>
            </div>
          )}
        </div>

        {/* In-App Notifications */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-lg bg-success/10 p-2">
              <Bell className="h-5 w-5 text-success" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">In-App Notifications</h2>
              <p className="text-sm text-muted-foreground">Configure notification center preferences</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
              <div>
                <Label>Real-time Updates</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Show real-time notifications in the notification center
                </p>
              </div>
              <Switch 
                checked={inAppSettings.realtimeEnabled}
                onCheckedChange={(checked) => setInAppSettings({ realtimeEnabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
              <div className="flex items-center gap-3">
                <Volume2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label>Sound Alerts</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Play a sound when new notifications arrive
                  </p>
                </div>
              </div>
              <Switch 
                checked={inAppSettings.soundEnabled}
                onCheckedChange={(checked) => setInAppSettings({ soundEnabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <div>
                  <Label>Browser Push Notifications</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {!browserNotificationsSupported 
                      ? 'Browser notifications are not supported in this browser'
                      : permission === 'denied'
                      ? 'Permission denied - enable in browser settings'
                      : 'Show native browser notifications for alerts'}
                  </p>
                </div>
              </div>
              <Switch 
                checked={inAppSettings.browserNotificationsEnabled && permission === 'granted'}
                onCheckedChange={handleBrowserNotificationToggle}
                disabled={!browserNotificationsSupported || permission === 'denied'}
              />
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="glass-card rounded-xl p-6 border-primary/20">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Security & Compliance</h3>
              <p className="text-sm text-muted-foreground mb-4">
                All data is encrypted at rest and in transit. Screenshot access is logged for audit purposes.
                Ensure HR consent is obtained before enabling monitoring for employees.
              </p>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm">
                  View Security Policy
                </Button>
                <Button variant="outline" size="sm">
                  Download Consent Template
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" className="gap-2" onClick={handleResetDefaults}>
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} className="gap-2" disabled={prefsSaving}>
            {prefsSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
