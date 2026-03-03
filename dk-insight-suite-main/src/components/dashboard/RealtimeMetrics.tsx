import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Monitor, Clock, Camera, Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricData {
  value: number;
  previousValue: number;
  label: string;
  format: 'number' | 'time' | 'percentage';
}

interface RealtimeMetricsProps {
  className?: string;
}

export function RealtimeMetrics({ className }: RealtimeMetricsProps) {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState({
    onlineDevices: { value: 0, previousValue: 0 },
    activeSessions: { value: 0, previousValue: 0 },
    screenshotsToday: { value: 0, previousValue: 0 },
    productivityScore: { value: 0, previousValue: 0 },
  });

  const fetchMetrics = async () => {
    if (!user) return;

    try {
      // Fetch online devices
      const { data: devices } = await supabase
        .from('devices')
        .select('status');
      
      const onlineDevices = devices?.filter(d => d.status === 'online').length || 0;

      // Fetch today's sessions
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: sessions } = await supabase
        .from('sessions')
        .select('active_seconds, idle_seconds, session_end')
        .gte('session_start', today.toISOString());

      const activeSessions = sessions?.filter(s => !s.session_end).length || 0;
      
      const totalActive = sessions?.reduce((acc, s) => acc + (s.active_seconds || 0), 0) || 0;
      const totalIdle = sessions?.reduce((acc, s) => acc + (s.idle_seconds || 0), 0) || 0;
      const productivityScore = totalActive + totalIdle > 0 
        ? Math.round((totalActive / (totalActive + totalIdle)) * 100) 
        : 0;

      // Fetch today's screenshots
      const { count: screenshotsToday } = await supabase
        .from('screenshots')
        .select('*', { count: 'exact', head: true })
        .gte('captured_at', today.toISOString());

      setMetrics(prev => ({
        onlineDevices: { value: onlineDevices, previousValue: prev.onlineDevices.value },
        activeSessions: { value: activeSessions, previousValue: prev.activeSessions.value },
        screenshotsToday: { value: screenshotsToday || 0, previousValue: prev.screenshotsToday.value },
        productivityScore: { value: productivityScore, previousValue: prev.productivityScore.value },
      }));
    } catch (err) {
      console.error('Error fetching realtime metrics:', err);
    }
  };

  useEffect(() => {
    fetchMetrics();

    // Subscribe to device changes
    const deviceChannel = supabase
      .channel('metrics-devices')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, fetchMetrics)
      .subscribe();

    // Subscribe to session changes
    const sessionChannel = supabase
      .channel('metrics-sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, fetchMetrics)
      .subscribe();

    // Subscribe to screenshot changes
    const screenshotChannel = supabase
      .channel('metrics-screenshots')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'screenshots' }, fetchMetrics)
      .subscribe();

    // Also poll every 15 seconds as backup
    const interval = setInterval(fetchMetrics, 15000);

    return () => {
      supabase.removeChannel(deviceChannel);
      supabase.removeChannel(sessionChannel);
      supabase.removeChannel(screenshotChannel);
      clearInterval(interval);
    };
  }, [user]);

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-4 w-4 text-success" />;
    if (current < previous) return <TrendingDown className="h-4 w-4 text-destructive" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const metricCards = [
    {
      label: 'Online Devices',
      value: metrics.onlineDevices.value,
      previousValue: metrics.onlineDevices.previousValue,
      icon: Monitor,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Active Sessions',
      value: metrics.activeSessions.value,
      previousValue: metrics.activeSessions.previousValue,
      icon: Activity,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      label: 'Screenshots Today',
      value: metrics.screenshotsToday.value,
      previousValue: metrics.screenshotsToday.previousValue,
      icon: Camera,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
    {
      label: 'Productivity Score',
      value: metrics.productivityScore.value,
      previousValue: metrics.productivityScore.previousValue,
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      suffix: '%',
    },
  ];

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {metricCards.map((metric) => (
        <div 
          key={metric.label} 
          className="glass-card rounded-xl p-4 flex items-center gap-4 group hover:border-primary/30 transition-colors"
        >
          <div className={cn('rounded-lg p-3', metric.bgColor)}>
            <metric.icon className={cn('h-6 w-6', metric.color)} />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{metric.label}</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-foreground">
                {metric.value}{metric.suffix || ''}
              </p>
              {getTrendIcon(metric.value, metric.previousValue)}
            </div>
          </div>
          <div className="h-2 w-2 rounded-full bg-success animate-pulse opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      ))}
    </div>
  );
}
