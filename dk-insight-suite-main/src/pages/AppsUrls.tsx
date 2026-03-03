import { useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { ScrollArea } from '@/components/ui/scroll-area';

const CATEGORY_COLORS = [
  'hsl(175, 84%, 40%)',   // In House Tools
  'hsl(207, 90%, 54%)',   // Analytics
  'hsl(280, 65%, 60%)',   // Internet
  'hsl(38, 92%, 50%)',    // Office Apps
  'hsl(340, 82%, 52%)',   // Chat & Messaging
  'hsl(145, 63%, 42%)',   // Developer
  'hsl(25, 95%, 53%)',    // Research & Reference
  'hsl(200, 70%, 50%)',   // Unmapped
  'hsl(60, 70%, 50%)',    // Job Search
  'hsl(320, 70%, 50%)',   // Productivity
  'hsl(180, 50%, 50%)',   // Email
  'hsl(300, 50%, 50%)',   // Design
];

export default function AppsUrls() {
  const topMetrics = {
    topApp: 'Google Chrome',
    topAppTime: '4.8K h:25m',
    topUrl: 'https://web.whatsapp.com/',
    topUrlTime: '581h:03m',
    topCategory: '-',
  };

  const categoryData = useMemo(() => [
    { name: 'In House Tools', value: 28.95, color: CATEGORY_COLORS[0] },
    { name: 'Analytics', value: 14.86, color: CATEGORY_COLORS[1] },
    { name: 'Internet', value: 14.20, color: CATEGORY_COLORS[2] },
    { name: 'Office Apps', value: 14.19, color: CATEGORY_COLORS[3] },
    { name: 'Chat & Messaging', value: 6.00, color: CATEGORY_COLORS[4] },
    { name: 'Developer', value: 5.05, color: CATEGORY_COLORS[5] },
    { name: 'Research & Reference', value: 4.07, color: CATEGORY_COLORS[6] },
    { name: 'Unmapped', value: 2.80, color: CATEGORY_COLORS[7] },
    { name: 'Job Search', value: 2.38, color: CATEGORY_COLORS[8] },
    { name: 'Productivity', value: 1.63, color: CATEGORY_COLORS[9] },
    { name: 'Email', value: 1.47, color: CATEGORY_COLORS[10] },
    { name: 'Design', value: 0.93, color: CATEGORY_COLORS[11] },
  ], []);

  const appUsageData = useMemo(() => [
    { name: 'Google Chrome', time: 845 },
    { name: 'Microsoft Excel', time: 520 },
    { name: 'Windows Explorer', time: 380 },
    { name: 'WhatsApp Root', time: 320 },
    { name: 'Antigravity', time: 280 },
    { name: 'Maya', time: 240 },
    { name: 'IVMS-4200 Framework.C', time: 200 },
    { name: 'Microsoft Word', time: 180 },
    { name: 'Chrome', time: 150 },
    { name: 'Adobe Premiere Pro 2025', time: 120 },
  ], []);

  const urlUsageData = useMemo(() => [
    { url: 'https://web.whatsapp.com/', time: 409, color: 'hsl(45, 93%, 47%)' },
    { url: 'https://dentalkart.vineretail.com/', time: 380, color: 'hsl(45, 93%, 47%)' },
    { url: 'https://one.zoho.in/', time: 340, color: 'hsl(45, 93%, 47%)' },
    { url: 'https://sheet.zoho.in/', time: 300, color: 'hsl(45, 93%, 47%)' },
    { url: 'https://admin.dentalkart.com/', time: 260, color: 'hsl(45, 93%, 47%)' },
    { url: 'https://chatgpt.com/', time: 220, color: 'hsl(45, 93%, 47%)' },
    { url: 'https://mail.zoho.in/', time: 190, color: 'hsl(45, 93%, 47%)' },
    { url: 'https://teams.dentalkart.com/', time: 160, color: 'hsl(45, 93%, 47%)' },
    { url: 'https://dentalkart1-my.sharepoint.com/', time: 130, color: 'hsl(45, 93%, 47%)' },
    { url: 'https://diq.zoho.in/', time: 100, color: 'hsl(45, 93%, 47%)' },
  ], []);

  const formatTime = (hours: number) => `${hours}h`;

  return (
    <MainLayout 
      title="Apps & URLs" 
      subtitle="Track application and website usage across your organization"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Top Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Top Application</CardTitle>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{topMetrics.topApp}</div>
              <p className="text-sm text-primary">{topMetrics.topAppTime}</p>
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
              <div className="text-xl font-bold text-foreground truncate">{topMetrics.topUrl}</div>
              <p className="text-sm text-primary">{topMetrics.topUrlTime}</p>
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
              <div className="text-xl font-bold text-muted-foreground">{topMetrics.topCategory}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Category Utilization */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Category Utilization</CardTitle>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex">
                <div className="h-[250px] w-[200px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={1}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-xl font-bold">6.8K h:06m</p>
                      <p className="text-sm text-muted-foreground">Total</p>
                    </div>
                  </div>
                </div>
                <ScrollArea className="h-[250px] flex-1 ml-4">
                  <div className="space-y-2">
                    {categoryData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-muted-foreground">{item.name}</span>
                        <span className="ml-auto font-medium">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>

          {/* Application Usage */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Application usage</CardTitle>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={appUsageData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis 
                      type="number" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickFormatter={formatTime}
                    />
                    <YAxis 
                      dataKey="name" 
                      type="category"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      width={120}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value}h`, 'Usage']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="time" fill="hsl(175, 84%, 40%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* URL Usage */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">URL usage</CardTitle>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={urlUsageData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis 
                      type="number" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickFormatter={formatTime}
                    />
                    <YAxis 
                      dataKey="url" 
                      type="category"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8 }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      width={160}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value}h`, 'Usage']}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="time" fill="hsl(45, 93%, 47%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
