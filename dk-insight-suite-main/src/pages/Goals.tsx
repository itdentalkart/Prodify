import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Info, Download, Search, Users } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const COLORS = {
  achieved: 'hsl(175, 84%, 40%)',
  missed: 'hsl(340, 82%, 52%)',
  previousAchieved: 'hsl(175, 60%, 60%)',
  previousMissed: 'hsl(340, 60%, 70%)',
};

const DISTRIBUTION_COLORS = ['hsl(145, 63%, 42%)', 'hsl(25, 95%, 53%)', 'hsl(45, 93%, 47%)', 'hsl(175, 84%, 40%)'];

interface Employee {
  id: string;
  name: string;
  empId: string;
  designation: string;
  dateOfJoining: string;
  presentDays: number;
  goalsAchievedDays: number;
  onlineTime: string;
  activeTime: string;
  activeTimeGoal: string;
  activityVsGoal: number;
  productiveTime: string;
}

export default function Goals() {
  const [searchQuery, setSearchQuery] = useState('');

  const goalAchievementData = [
    { name: 'Achieved', value: 76, color: COLORS.achieved },
    { name: 'Missed', value: 236, color: COLORS.missed },
  ];

  const goalDistributionData = [
    { range: '0-25%', count: 45, color: DISTRIBUTION_COLORS[0] },
    { range: '25-50%', count: 29, color: DISTRIBUTION_COLORS[1] },
    { range: '50-75%', count: 63, color: DISTRIBUTION_COLORS[2] },
    { range: 'more than 75%', count: 175, color: DISTRIBUTION_COLORS[3] },
  ];

  const teamGoalData = useMemo(() => [
    { name: 'ACCOUNTS F...', previousAchieved: 8, currentAchieved: 5, previousMissed: 3, currentMissed: 12 },
    { name: 'CONTENT', previousAchieved: 10, currentAchieved: 8, previousMissed: 5, currentMissed: 15 },
    { name: 'CREATIVE', previousAchieved: 6, currentAchieved: 4, previousMissed: 8, currentMissed: 20 },
    { name: 'CUSTOMER S...', previousAchieved: 12, currentAchieved: 10, previousMissed: 2, currentMissed: 8 },
    { name: 'Default', previousAchieved: 35, currentAchieved: 28, previousMissed: 10, currentMissed: 42 },
    { name: 'Digital Market...', previousAchieved: 8, currentAchieved: 6, previousMissed: 4, currentMissed: 12 },
    { name: 'HR Department', previousAchieved: 4, currentAchieved: 3, previousMissed: 6, currentMissed: 10 },
    { name: 'IMPORT', previousAchieved: 6, currentAchieved: 5, previousMissed: 5, currentMissed: 14 },
    { name: 'INSIDE SALES', previousAchieved: 5, currentAchieved: 4, previousMissed: 7, currentMissed: 12 },
    { name: 'IT', previousAchieved: 3, currentAchieved: 2, previousMissed: 8, currentMissed: 15 },
    { name: 'LOGISTICS', previousAchieved: 7, currentAchieved: 5, previousMissed: 4, currentMissed: 10 },
    { name: 'MANAGEMENT', previousAchieved: 15, currentAchieved: 12, previousMissed: 3, currentMissed: 25 },
    { name: 'OPERATIONS', previousAchieved: 10, currentAchieved: 8, previousMissed: 5, currentMissed: 18 },
    { name: 'PROCUREM...', previousAchieved: 8, currentAchieved: 6, previousMissed: 4, currentMissed: 12 },
    { name: 'PRODUCT', previousAchieved: 18, currentAchieved: 15, previousMissed: 2, currentMissed: 20 },
    { name: 'TENDER', previousAchieved: 4, currentAchieved: 3, previousMissed: 6, currentMissed: 8 },
    { name: 'WALDENT', previousAchieved: 5, currentAchieved: 4, previousMissed: 5, currentMissed: 10 },
  ], []);

  const employees: Employee[] = useMemo(() => [
    { id: '1', name: 'Aadil Saifi', empId: 'VASA321', designation: '-', dateOfJoining: '-', presentDays: 6, goalsAchievedDays: 6, onlineTime: '49h:34m:23s', activeTime: '40h:31m:00s', activeTimeGoal: '30h:00m:00s', activityVsGoal: 135.1, productiveTime: '40h:04m:53s' },
    { id: '2', name: 'Aadya Kashyap', empId: 'VASA798', designation: '-', dateOfJoining: '-', presentDays: 6, goalsAchievedDays: 2, onlineTime: '39h:31m:25s', activeTime: '22h:57m:04s', activeTimeGoal: '30h:00m:00s', activityVsGoal: 76.5, productiveTime: '24h:28m:14s' },
    { id: '3', name: 'Aakash Singh', empId: 'VASA1064', designation: '-', dateOfJoining: '-', presentDays: 6, goalsAchievedDays: 4, onlineTime: '48h:32m:21s', activeTime: '30h:33m:20s', activeTimeGoal: '30h:00m:00s', activityVsGoal: 101.8, productiveTime: '31h:30m:20s' },
  ], []);

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.empId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout 
      title="Goals" 
      subtitle="Achieve minimum 5 hours of Active time and 5 hours of Productive time"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Top Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Goal Achievement Status */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Goal Achievement Status</CardTitle>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="h-[200px] w-[200px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={goalAchievementData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {goalAchievementData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-3xl font-bold">312</p>
                      <p className="text-sm text-muted-foreground">Total</p>
                    </div>
                  </div>
                </div>
                <div className="ml-8 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.achieved }} />
                    <span className="text-sm">76</span>
                    <span className="text-muted-foreground text-sm">Achieved Goal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.missed }} />
                    <span className="text-sm">236</span>
                    <span className="text-muted-foreground text-sm">Missed Goal</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Goal Achievement Distribution */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Goal Achievement Distribution</CardTitle>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6 mb-4">
                {goalDistributionData.map((item, index) => (
                  <div key={item.range} className="flex items-center gap-2">
                    <Users className="h-5 w-5" style={{ color: item.color }} />
                    <span className="text-2xl font-bold">{item.count}</span>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-muted-foreground">{item.range}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="h-4 flex rounded-full overflow-hidden">
                {goalDistributionData.map((item) => (
                  <div 
                    key={item.range}
                    className="h-full" 
                    style={{ 
                      backgroundColor: item.color, 
                      width: `${(item.count / 312) * 100}%` 
                    }} 
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Teamwise Goal Comparison */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Teamwise Goal Comparison</CardTitle>
              <Info className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamGoalData}>
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
                    label={{ value: 'users', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="previousAchieved" name="Users previously achieved goals" fill={COLORS.previousAchieved} stackId="achieved" />
                  <Bar dataKey="currentAchieved" name="Users current achieved goals" fill={COLORS.achieved} stackId="achieved" />
                  <Bar dataKey="previousMissed" name="Users previously missed goals" fill={COLORS.previousMissed} stackId="missed" />
                  <Bar dataKey="currentMissed" name="Users current missed goals" fill={COLORS.missed} stackId="missed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Employee List */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Employee List</CardTitle>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Date of Joining</TableHead>
                    <TableHead>Present days</TableHead>
                    <TableHead>Goals achieved days</TableHead>
                    <TableHead>Online time</TableHead>
                    <TableHead>Active time</TableHead>
                    <TableHead>Active time goal</TableHead>
                    <TableHead>Activity vs Goal</TableHead>
                    <TableHead>Productive time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-amber-500 text-white text-xs">
                              {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{emp.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-green-500/20 text-green-500">
                          {emp.empId}
                        </Badge>
                      </TableCell>
                      <TableCell>{emp.designation}</TableCell>
                      <TableCell>{emp.dateOfJoining}</TableCell>
                      <TableCell>{emp.presentDays} days</TableCell>
                      <TableCell>{emp.goalsAchievedDays} days</TableCell>
                      <TableCell>{emp.onlineTime}</TableCell>
                      <TableCell>{emp.activeTime}</TableCell>
                      <TableCell>{emp.activeTimeGoal}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${emp.activityVsGoal >= 100 ? 'bg-primary' : 'bg-destructive'}`}
                              style={{ width: `${Math.min(100, emp.activityVsGoal)}%` }}
                            />
                          </div>
                          <span className={emp.activityVsGoal >= 100 ? 'text-primary' : 'text-destructive'}>
                            {emp.activityVsGoal}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{emp.productiveTime}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
