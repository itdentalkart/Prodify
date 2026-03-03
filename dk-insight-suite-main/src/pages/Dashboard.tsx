import { MainLayout } from '@/components/layout/MainLayout';
import { ProductivityChart } from '@/components/dashboard/ProductivityChart';
import { ProductivityGauge } from '@/components/dashboard/ProductivityGauge';
import { RealtimeMetrics } from '@/components/dashboard/RealtimeMetrics';
import { LiveDeviceStatus } from '@/components/dashboard/LiveDeviceStatus';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useProductivityData } from '@/hooks/useProductivityData';
import { AlertTriangle, Loader2, Radio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const { metrics, loading: metricsLoading } = useDashboardData();
  const { timelineData } = useProductivityData();

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const productivityScore = metrics.totalActiveTime + metrics.totalIdleTime > 0
    ? Math.round((metrics.totalActiveTime / (metrics.totalActiveTime + metrics.totalIdleTime)) * 100)
    : 0;

  if (metricsLoading) {
    return (
      <MainLayout title="Dashboard" subtitle="Loading...">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      title="Dashboard" 
      subtitle={
        <span className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-success animate-pulse" />
          Real-time monitoring active
        </span>
      }
    >
      <div className="space-y-6 animate-fade-in">
        {/* Real-time Metrics */}
        <RealtimeMetrics />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Productivity Chart */}
          <div className="lg:col-span-2">
            <ProductivityChart data={timelineData} title="Today's Activity Timeline" />
          </div>

          {/* Productivity Score */}
          <div className="glass-card rounded-xl p-6 flex flex-col items-center justify-center">
            <ProductivityGauge score={productivityScore} size="lg" />
            <div className="mt-6 w-full space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Active Time</span>
                <span className="font-medium text-success">
                  {formatTime(metrics.totalActiveTime)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Idle Time</span>
                <span className="font-medium text-warning">
                  {formatTime(metrics.totalIdleTime)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Device Status & Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LiveDeviceStatus onDeviceClick={() => navigate('/devices')} />
          <ActivityFeed />
        </div>

        {/* Alerts Section */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <h2 className="text-lg font-semibold text-foreground">Recent Alerts</h2>
          </div>
          <div className="text-center py-4 text-muted-foreground text-sm">
            No active alerts
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
