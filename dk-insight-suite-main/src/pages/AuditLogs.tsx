import { MainLayout } from '@/components/layout/MainLayout';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { format } from 'date-fns';
import { Shield, Eye, Download, Monitor, Filter, Loader2, Trash2, Settings, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export default function AuditLogs() {
  const { logs, loading } = useAuditLogs();

  const getActionIcon = (action: string) => {
    if (action.includes('SCREENSHOT') || action.includes('VIEW')) return <Eye className="h-4 w-4" />;
    if (action.includes('EXPORT') || action.includes('DOWNLOAD')) return <Download className="h-4 w-4" />;
    if (action.includes('DEVICE') || action.includes('ENROLL')) return <Monitor className="h-4 w-4" />;
    if (action.includes('DELETE')) return <Trash2 className="h-4 w-4" />;
    if (action.includes('SETTING') || action.includes('UPDATE') || action.includes('CONFIG')) return <Settings className="h-4 w-4" />;
    if (action.includes('USER') || action.includes('LOGIN')) return <UserPlus className="h-4 w-4" />;
    return <Shield className="h-4 w-4" />;
  };

  const getActionBadge = (action: string) => {
    let style = 'bg-secondary text-muted-foreground border-border';
    
    if (action.includes('VIEW') || action.includes('READ')) {
      style = 'bg-info/10 text-info border-info/20';
    } else if (action.includes('EXPORT') || action.includes('DOWNLOAD') || action.includes('CREATE')) {
      style = 'bg-success/10 text-success border-success/20';
    } else if (action.includes('ENROLL') || action.includes('DEVICE')) {
      style = 'bg-primary/10 text-primary border-primary/20';
    } else if (action.includes('UPDATE') || action.includes('SETTING') || action.includes('CONFIG')) {
      style = 'bg-warning/10 text-warning border-warning/20';
    } else if (action.includes('DELETE') || action.includes('REMOVE')) {
      style = 'bg-destructive/10 text-destructive border-destructive/20';
    }

    return (
      <span className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
        style
      )}>
        {getActionIcon(action)}
        {action.replace(/_/g, ' ')}
      </span>
    );
  };

  const screenshotViews = logs.filter(l => l.action.includes('SCREENSHOT') || l.action.includes('VIEW')).length;
  const configChanges = logs.filter(l => l.action.includes('UPDATE') || l.action.includes('SETTING') || l.action.includes('CONFIG')).length;

  return (
    <MainLayout 
      title="Audit Logs" 
      subtitle="Track all system activities and screenshot access"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Actions Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export Logs
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-card rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Events</p>
            <p className="text-2xl font-bold text-foreground">{logs.length}</p>
          </div>
          <div className="glass-card rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Screenshot Views</p>
            <p className="text-2xl font-bold text-info">{screenshotViews}</p>
          </div>
          <div className="glass-card rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Config Changes</p>
            <p className="text-2xl font-bold text-warning">{configChanges}</p>
          </div>
        </div>

        {/* Audit Log Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : logs.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <p className="text-muted-foreground">No audit logs yet</p>
            <p className="text-sm text-muted-foreground mt-2">Activity logs will appear as users interact with the system</p>
          </div>
        ) : (
          <div className="glass-card rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Timestamp</TableHead>
                  <TableHead className="text-muted-foreground">User</TableHead>
                  <TableHead className="text-muted-foreground">Action</TableHead>
                  <TableHead className="text-muted-foreground">Resource</TableHead>
                  <TableHead className="text-muted-foreground">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const userName = log.profiles?.display_name || log.profiles?.email || log.user_id?.slice(0, 8) || 'System';
                  const details = typeof log.details === 'object' ? log.details : {};
                  
                  return (
                    <TableRow key={log.id} className="border-border">
                      <TableCell className="text-foreground font-mono text-sm">
                        {log.created_at ? format(new Date(log.created_at), 'MMM dd, HH:mm:ss') : '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{userName}</TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-secondary px-2 py-1 rounded text-muted-foreground">
                          {log.resource_type || 'unknown'}/{log.resource_id?.slice(0, 12) || 'n/a'}
                        </code>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-xs truncate">
                        {Object.keys(details || {}).length > 0 ? JSON.stringify(details) : '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Compliance Notice */}
        <div className="glass-card rounded-xl p-6 border-primary/20">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Compliance & Privacy</h3>
              <p className="text-sm text-muted-foreground">
                All screenshot access is logged for compliance purposes. Logs are retained for 90 days 
                and can be exported for auditing. Access is restricted to authorized personnel only.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
