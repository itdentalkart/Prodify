import { MainLayout } from '@/components/layout/MainLayout';
import { ProductivityChart } from '@/components/dashboard/ProductivityChart';
import { ProductivityGauge } from '@/components/dashboard/ProductivityGauge';
import { useProductivityData } from '@/hooks/useProductivityData';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { Clock, TrendingUp, Users, Activity, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Productivity() {
  const { metrics, timelineData, userProductivity, devices, loading } = useProductivityData();

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const pieData = [
    { name: 'Active', value: metrics.totalActiveTime || 1, color: 'hsl(175, 84%, 40%)' },
    { name: 'Idle', value: metrics.totalIdleTime || 1, color: 'hsl(38, 92%, 50%)' },
  ];

  const activeDevices = devices.filter(d => d.status !== 'offline').length;
  const avgActiveHours = metrics.totalSessions > 0 
    ? formatTime(Math.round(metrics.totalActiveTime / Math.max(metrics.totalSessions, 1)))
    : '0h 0m';

  if (loading) {
    return (
      <MainLayout title="Productivity" subtitle="Analyze team productivity and performance metrics">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      title="Productivity" 
      subtitle="Analyze team productivity and performance metrics"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Top Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Avg. Active Time"
            value={avgActiveHours}
            subtitle="Per session"
            icon={Clock}
          />
          <MetricCard
            title="Team Productivity"
            value={`${metrics.productivityScore}%`}
            subtitle="Organization average"
            icon={TrendingUp}
            trend={metrics.productivityScore > 70 ? { value: 5, isPositive: true } : undefined}
          />
          <MetricCard
            title="Active Devices"
            value={activeDevices}
            subtitle="Currently working"
            icon={Users}
          />
          <MetricCard
            title="Sessions Today"
            value={metrics.totalSessions}
            subtitle="Total tracked"
            icon={Activity}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity Timeline */}
          <div className="lg:col-span-2">
            <ProductivityChart data={timelineData} title="Activity Over Time" />
          </div>

          {/* Time Distribution */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Time Distribution</h3>
            {metrics.totalActiveTime > 0 || metrics.totalIdleTime > 0 ? (
              <>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => formatTime(value)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {pieData.map(item => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-muted-foreground">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {formatTime(item.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[200px] flex items-center justify-center">
                <p className="text-muted-foreground text-sm">No data available yet</p>
              </div>
            )}
          </div>
        </div>

        {/* User Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="chart-container">
            <h3 className="text-lg font-semibold text-foreground mb-4">User Productivity Comparison</h3>
            {userProductivity.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={userProductivity} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      type="number" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis 
                      dataKey="name" 
                      type="category"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      width={80}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="active" name="Active Hours" fill="hsl(175, 84%, 40%)" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="idle" name="Idle Hours" fill="hsl(38, 92%, 50%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground text-sm">No user data available yet</p>
              </div>
            )}
          </div>

          {/* Top Performers */}
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Top Performers</h3>
            {devices.filter(d => d.profiles).length > 0 ? (
              <div className="space-y-4">
                {devices
                  .filter(d => d.profiles)
                  .slice(0, 5)
                  .map((device, index) => {
                    const score = device.status === 'online' ? 95 - index * 5 : 70 - index * 5;
                    const userName = device.profiles?.display_name || device.profiles?.email || 'Unknown';
                    
                    return (
                      <div key={device.id} className="flex items-center gap-4">
                        <span className="text-lg font-bold text-muted-foreground w-6">
                          #{index + 1}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{userName}</p>
                          <p className="text-xs text-muted-foreground">{device.location || device.hostname}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">{Math.max(score, 50)}%</p>
                          <p className="text-xs text-muted-foreground">Score</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center">
                <p className="text-muted-foreground text-sm">No users assigned to devices yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
