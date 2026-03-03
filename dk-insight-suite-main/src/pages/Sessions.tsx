import { MainLayout } from '@/components/layout/MainLayout';
import { useSessions } from '@/hooks/useSessions';
import { useDevices } from '@/hooks/useDevices';
import { format } from 'date-fns';
import { Clock, Monitor, User, Activity, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export default function Sessions() {
  const { sessions, loading } = useSessions();
  const { devices } = useDevices();

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '—';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const activeSessions = sessions.filter(s => !s.session_end).length;
  const uniqueDevices = new Set(sessions.map(s => s.device_id)).size;

  // Calculate average duration
  const completedSessions = sessions.filter(s => s.session_end && s.active_seconds);
  const avgDuration = completedSessions.length > 0
    ? Math.round(completedSessions.reduce((sum, s) => sum + (s.active_seconds || 0), 0) / completedSessions.length)
    : 0;

  return (
    <MainLayout 
      title="Sessions" 
      subtitle="Track user login sessions and activity periods"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="glass-card rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Sessions</p>
                <p className="text-2xl font-bold text-foreground">{activeSessions}</p>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-success/10 p-2">
                <Clock className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
                <p className="text-2xl font-bold text-foreground">{sessions.length}</p>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-info/10 p-2">
                <Monitor className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unique Devices</p>
                <p className="text-2xl font-bold text-foreground">{uniqueDevices}</p>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-warning/10 p-2">
                <User className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg. Duration</p>
                <p className="text-2xl font-bold text-foreground">{formatDuration(avgDuration)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sessions Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <p className="text-muted-foreground">No sessions recorded yet</p>
            <p className="text-sm text-muted-foreground mt-2">Sessions will appear once devices start reporting activity</p>
          </div>
        ) : (
          <div className="glass-card rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">User</TableHead>
                  <TableHead className="text-muted-foreground">Device</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Started</TableHead>
                  <TableHead className="text-muted-foreground">Ended</TableHead>
                  <TableHead className="text-muted-foreground">Active Time</TableHead>
                  <TableHead className="text-muted-foreground">Idle Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => {
                  const isActive = !session.session_end;
                  const userName = session.profiles?.display_name || session.profiles?.email || 'Unknown';
                  
                  return (
                    <TableRow key={session.id} className="border-border">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-secondary p-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <span className="font-medium text-foreground">{userName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {session.devices?.hostname || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
                          isActive 
                            ? 'bg-success/10 text-success border-success/20'
                            : 'bg-muted text-muted-foreground border-border'
                        )}>
                          <span className={cn(
                            'w-1.5 h-1.5 rounded-full',
                            isActive ? 'bg-success animate-pulse' : 'bg-muted-foreground'
                          )} />
                          {isActive ? 'Active' : 'Completed'}
                        </span>
                      </TableCell>
                      <TableCell className="text-foreground">
                        {session.session_start ? format(new Date(session.session_start), 'MMM dd, HH:mm') : '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {session.session_end ? format(new Date(session.session_end), 'HH:mm') : '—'}
                      </TableCell>
                      <TableCell className="text-success font-medium">
                        {formatDuration(session.active_seconds)}
                      </TableCell>
                      <TableCell className="text-warning font-medium">
                        {formatDuration(session.idle_seconds)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
