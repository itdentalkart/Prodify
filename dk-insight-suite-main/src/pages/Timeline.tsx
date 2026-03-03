import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar, RefreshCw, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

// Activity level types
type ActivityLevel = 'high' | 'medium' | 'low' | 'idle' | 'offline' | 'break';

interface TimeSlot {
  hour: number;
  level: ActivityLevel;
}

interface UserTimeline {
  id: string;
  name: string;
  deviceId: string;
  punchIn?: string;
  punchOut?: string;
  slots: TimeSlot[];
}

const ACTIVITY_COLORS: Record<ActivityLevel, string> = {
  high: 'bg-blue-600',
  medium: 'bg-blue-400',
  low: 'bg-blue-300',
  idle: 'bg-pink-400',
  offline: 'bg-pink-600',
  break: 'bg-yellow-400',
};

const generateRandomTimeline = (name: string, id: string): UserTimeline => {
  const slots: TimeSlot[] = [];
  const levels: ActivityLevel[] = ['high', 'medium', 'low', 'idle', 'offline', 'break'];
  
  for (let hour = 8; hour <= 23; hour++) {
    // Create 4 slots per hour (15 min each)
    for (let i = 0; i < 4; i++) {
      const randomLevel = levels[Math.floor(Math.random() * levels.length)];
      slots.push({ hour: hour + i * 0.25, level: randomLevel });
    }
  }

  return {
    id,
    name,
    deviceId: `WIN${['LAP', 'DESK'][Math.floor(Math.random() * 2)]}CTP${Math.floor(Math.random() * 1000)}`,
    punchIn: '09:00 am',
    punchOut: '06:00 pm',
    slots,
  };
};

export default function Timeline() {
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  const users = useMemo(() => [
    generateRandomTimeline('Aadil Saifi', '1'),
    generateRandomTimeline('Aadya Kashyap', '2'),
    generateRandomTimeline('Aakash Singh', '3'),
    generateRandomTimeline('Aarchi', '4'),
    generateRandomTimeline('Aayushi', '5'),
    generateRandomTimeline('Abhiram Gaur', '6'),
    generateRandomTimeline('Abhishek Kumar Mittal', '7'),
    generateRandomTimeline('Abhishek Pranjal', '8'),
    generateRandomTimeline('Abhishek Tripathi', '9'),
    generateRandomTimeline('Abhitesh Dahiya', '10'),
    generateRandomTimeline('Ajay Kumar', '11'),
    generateRandomTimeline('Akshay Sharma', '12'),
  ], []);

  const totalPages = Math.ceil(users.length / usersPerPage);
  const paginatedUsers = users.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  const hours = Array.from({ length: 16 }, (_, i) => {
    const hour = i + 8;
    if (hour === 12) return '12:00 pm';
    if (hour > 12) return `${hour - 12}:00 pm`;
    return `${hour}:00 am`;
  });

  return (
    <MainLayout 
      title="Timeline" 
      subtitle="View daily activity timeline for all users"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Teams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              <SelectItem value="product">Product</SelectItem>
              <SelectItem value="engineering">Engineering</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {users.map(user => (
                <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              2026-01-19
            </Button>
            <Button variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Timeline Grid */}
        <Card className="glass-card overflow-hidden">
          <CardContent className="p-0">
            <ScrollArea className="w-full">
              <div className="min-w-[1200px]">
                {/* Header */}
                <div className="flex border-b border-border">
                  <div className="w-[280px] flex-shrink-0 px-4 py-3 border-r border-border">
                    <span className="text-sm font-medium">Users</span>
                    <span className="text-muted-foreground text-sm ml-2">Total:{users.length}</span>
                  </div>
                  <div className="flex-1 flex">
                    {hours.map((hour, i) => (
                      <div 
                        key={i} 
                        className="flex-1 text-center py-3 text-xs text-muted-foreground border-r border-border last:border-r-0"
                      >
                        {hour}
                      </div>
                    ))}
                  </div>
                </div>

                {/* User Rows */}
                {paginatedUsers.map((user) => (
                  <div key={user.id} className="flex border-b border-border last:border-b-0 hover:bg-muted/30">
                    <div className="w-[280px] flex-shrink-0 px-4 py-3 border-r border-border flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-amber-500 text-white text-xs">
                          {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{user.name} {user.deviceId}</p>
                      </div>
                    </div>
                    <div className="flex-1 flex items-center relative py-2">
                      {/* Punch in marker */}
                      <div className="absolute left-[12.5%] top-0 transform -translate-x-1/2">
                        <div className="w-0 h-0 border-l-4 border-r-4 border-t-6 border-l-transparent border-r-transparent border-t-green-500" />
                      </div>
                      
                      {/* Activity blocks */}
                      <div className="flex-1 flex h-6 gap-[1px] px-1">
                        {user.slots.map((slot, i) => (
                          <div
                            key={i}
                            className={`flex-1 ${ACTIVITY_COLORS[slot.level]} rounded-[2px]`}
                          />
                        ))}
                      </div>
                      
                      {/* Punch out marker */}
                      <div className="absolute left-[62.5%] top-0 transform -translate-x-1/2">
                        <div className="w-0 h-0 border-l-4 border-r-4 border-b-6 border-l-transparent border-r-transparent border-b-red-500" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Legend and Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-6 border-l-transparent border-r-transparent border-t-green-500" />
              <span className="text-xs text-muted-foreground">Punch In</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-0 h-0 border-l-4 border-r-4 border-b-6 border-l-transparent border-r-transparent border-b-red-500" />
              <span className="text-xs text-muted-foreground">Punch Out</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-pink-600" />
              <span className="text-xs text-muted-foreground">Offline</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-blue-600" />
              <span className="text-xs text-muted-foreground">&gt;75%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-blue-400" />
              <span className="text-xs text-muted-foreground">50%-75%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-blue-300" />
              <span className="text-xs text-muted-foreground">25%-50%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-pink-400" />
              <span className="text-xs text-muted-foreground">&lt;25%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-yellow-400" />
              <span className="text-xs text-muted-foreground">Break time</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="icon"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
            {totalPages > 5 && <span className="px-2">...</span>}
            {totalPages > 5 && (
              <Button variant="outline" size="icon" onClick={() => setCurrentPage(totalPages)}>
                {totalPages}
              </Button>
            )}
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
