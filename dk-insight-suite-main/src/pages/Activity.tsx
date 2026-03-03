import { useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

const COLORS = {
  active: 'hsl(207, 90%, 54%)',
  idle: 'hsl(207, 40%, 70%)',
  high: 'hsl(207, 90%, 54%)',
  medium: 'hsl(207, 70%, 65%)',
  low: 'hsl(207, 50%, 80%)',
};

export default function Activity() {
  // Mock data for activity metrics
  const activityMetrics = {
    activityPercent: 53.34,
    totalTime: '6.7K h:45m',
    topApp: 'Google Chrome',
    topAppTime: '4.8K h:25m',
    topUrl: 'https://web.whats...',
    topUrlTime: '581h:03m',
  };

  const onlineTimeData = [
    { name: 'Active time', value: 6745, color: COLORS.active },
    { name: 'Idle time', value: 5905, color: COLORS.idle },
  ];

  const activityLevelData = [
    { name: '75-100%', value: 72, color: COLORS.high },
    { name: '50-75%', value: 133, color: COLORS.medium },
    { name: '<50%', value: 107, color: COLORS.low },
  ];

  const mostActiveTeams = [
    { name: 'PRODUCT', percentage: 79.80 },
    { name: 'CONTENT', percentage: 67.45 },
    { name: 'LOGISTICS', percentage: 66.97 },
  ];

  const leastActiveTeams = [
    { name: 'IT', percentage: 36.74 },
    { name: 'MANAGEMENT', percentage: 39.79 },
    { name: 'Default', percentage: 41.52 },
  ];

  const teamActivityData = useMemo(() => [
    { name: 'OPERATIONS', active: 1450, idle: 750 },
    { name: 'PRODUCT', active: 1200, idle: 600 },
    { name: 'PROCUREM...', active: 980, idle: 520 },
    { name: 'WALDENT', active: 890, idle: 480 },
    { name: 'CUSTOMER S...', active: 850, idle: 450 },
    { name: 'Default', active: 720, idle: 380 },
    { name: 'INSIDE SALES', active: 680, idle: 350 },
    { name: 'CONTENT', active: 650, idle: 320 },
    { name: 'ACCOUNTS F...', active: 580, idle: 290 },
    { name: 'HR Department', active: 520, idle: 260 },
    { name: 'Digital Market...', active: 480, idle: 240 },
    { name: 'IMPORT', active: 450, idle: 220 },
    { name: 'CREATIVE', active: 420, idle: 200 },
    { name: 'IT', active: 350, idle: 180 },
    { name: 'MANAGEMENT', active: 320, idle: 160 },
    { name: 'TENDER', active: 280, idle: 140 },
    { name: 'LOGISTICS', active: 250, idle: 120 },
  ], []);

  const formatTime = (hours: number) => {
    return `${hours}h`;
  };

  return (
    <MainLayout 
      title="Activity" 
      subtitle="Monitor team activity levels and engagement metrics"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Top Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Activity</CardTitle>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{activityMetrics.activityPercent}%</div>
              <p className="text-sm text-primary">{activityMetrics.totalTime}</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Top Application</CardTitle>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-foreground">{activityMetrics.topApp}</div>
              <p className="text-sm text-primary">{activityMetrics.topAppTime}</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Top URL</CardTitle>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-foreground truncate">{activityMetrics.topUrl}</div>
              <p className="text-sm text-primary">{activityMetrics.topUrlTime}</p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Top Category</CardTitle>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-muted-foreground">-</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Online Time Breakdown */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Online Time Breakdown</CardTitle>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="text-muted-foreground">Total online time</span>
                  <p className="text-xl font-bold">12565h 50m</p>
                  <span className="text-xs text-muted-foreground">For the last 7 days</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Average online time</span>
                  <p className="text-xl font-bold">07h 30m</p>
                  <span className="text-xs text-muted-foreground">Average per day</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={onlineTimeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {onlineTimeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold">12.6K h:50m</p>
                    <p className="text-sm text-muted-foreground">Total</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                {onlineTimeData.map(item => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-muted-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Activity Level Breakdown */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Activity Level Breakdown</CardTitle>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={activityLevelData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {activityLevelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold">312</p>
                    <p className="text-sm text-muted-foreground">Total</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                {activityLevelData.map(item => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                    <span className="text-xs text-muted-foreground">{item.value} {item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Activity Outliers */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Activity outliers</CardTitle>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-green-500">⚡</span>
                  <span className="font-medium">Most active Team(s)</span>
                </div>
                <div className="space-y-2">
                  {mostActiveTeams.map((team, index) => (
                    <div key={team.name} className="flex items-center gap-3">
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">#{index + 1}</span>
                      <span className="text-sm flex-1">{team.name}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full" 
                          style={{ width: `${team.percentage}%` }} 
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-16 text-right">{team.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-orange-500">⚡</span>
                  <span className="font-medium">Least active Team(s)</span>
                </div>
                <div className="space-y-2">
                  {leastActiveTeams.map((team, index) => (
                    <div key={team.name} className="flex items-center gap-3">
                      <span className="text-xs bg-orange-500/20 text-orange-500 px-2 py-0.5 rounded">#{index + 1}</span>
                      <span className="text-sm flex-1">{team.name}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-orange-500 rounded-full" 
                          style={{ width: `${team.percentage}%` }} 
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-16 text-right">{team.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Activity Breakdown */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Team wise Activity Breakdown</CardTitle>
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamActivityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickFormatter={formatTime}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="active" name="Active time" fill={COLORS.active} stackId="a" />
                  <Bar dataKey="idle" name="Idle time" fill={COLORS.idle} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
