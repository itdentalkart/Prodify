import { useState } from 'react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Monitor, Laptop, MoreVertical, Eye, Settings, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DeviceWithUser } from '@/hooks/useDevices';
import { Database } from '@/integrations/supabase/types';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type DeviceStatus = Database['public']['Enums']['device_status'];

interface DeviceTableProps {
  devices: DeviceWithUser[];
  onDeviceDeleted?: () => void;
}

export function DeviceTable({ devices, onDeviceDeleted }: DeviceTableProps) {
  const navigate = useNavigate();
  const [deviceToDelete, setDeviceToDelete] = useState<DeviceWithUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const getStatusBadge = (status: DeviceStatus | null) => {
    const statusValue = status || 'offline';
    const styles: Record<string, string> = {
      online: 'bg-success/10 text-success border-success/20',
      idle: 'bg-warning/10 text-warning border-warning/20',
      offline: 'bg-destructive/10 text-destructive border-destructive/20',
    };

    return (
      <span className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
        styles[statusValue]
      )}>
        <span className={cn(
          'w-1.5 h-1.5 rounded-full',
          statusValue === 'online' && 'bg-success animate-pulse',
          statusValue === 'idle' && 'bg-warning',
          statusValue === 'offline' && 'bg-destructive',
        )} />
        {statusValue.charAt(0).toUpperCase() + statusValue.slice(1)}
      </span>
    );
  };

  const handleDeleteDevice = async () => {
    if (!deviceToDelete) return;
    
    setIsDeleting(true);
    try {
      // First delete related data (screenshots, sessions, telemetry)
      // These have foreign keys and need to be deleted first
      const { error: screenshotsError } = await supabase
        .from('screenshots')
        .delete()
        .eq('device_id', deviceToDelete.id);
      
      if (screenshotsError) {
        console.error('Error deleting screenshots:', screenshotsError);
      }

      const { error: sessionsError } = await supabase
        .from('sessions')
        .delete()
        .eq('device_id', deviceToDelete.id);
      
      if (sessionsError) {
        console.error('Error deleting sessions:', sessionsError);
      }

      const { error: telemetryError } = await supabase
        .from('telemetry_events')
        .delete()
        .eq('device_id', deviceToDelete.id);
      
      if (telemetryError) {
        console.error('Error deleting telemetry:', telemetryError);
      }

      // Also delete enrollment tokens that used this device
      await supabase
        .from('enrollment_tokens')
        .update({ used_by_device_id: null })
        .eq('used_by_device_id', deviceToDelete.id);

      // Finally delete the device
      const { error: deviceError } = await supabase
        .from('devices')
        .delete()
        .eq('id', deviceToDelete.id);

      if (deviceError) {
        throw deviceError;
      }

      // Delete screenshots from storage
      const { data: files } = await supabase.storage
        .from('screenshots')
        .list(`${deviceToDelete.org_id}/${deviceToDelete.id}`);
      
      if (files && files.length > 0) {
        const filePaths = files.map(f => `${deviceToDelete.org_id}/${deviceToDelete.id}/${f.name}`);
        await supabase.storage.from('screenshots').remove(filePaths);
      }

      toast.success(`Device "${deviceToDelete.hostname}" deleted successfully`);
      onDeviceDeleted?.();
    } catch (error: any) {
      console.error('Error deleting device:', error);
      toast.error(`Failed to delete device: ${error.message}`);
    } finally {
      setIsDeleting(false);
      setDeviceToDelete(null);
    }
  };

  return (
    <>
      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Device</TableHead>
              <TableHead className="text-muted-foreground">User</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">OS</TableHead>
              <TableHead className="text-muted-foreground">Location</TableHead>
              <TableHead className="text-muted-foreground">Last Seen</TableHead>
              <TableHead className="text-muted-foreground">Agent</TableHead>
              <TableHead className="text-muted-foreground w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {devices.map((device) => {
              const DeviceIcon = device.device_type === 'Laptop' ? Laptop : Monitor;
              const userName = device.profiles?.display_name || device.profiles?.email || 'Unassigned';
              
              return (
                <TableRow 
                  key={device.id} 
                  className="border-border cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => navigate(`/devices/${device.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-secondary p-2">
                        <DeviceIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{device.hostname}</p>
                        <p className="text-xs text-muted-foreground">{device.ip_address || 'N/A'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-foreground">{userName}</TableCell>
                  <TableCell>{getStatusBadge(device.status)}</TableCell>
                  <TableCell className="text-muted-foreground">{device.os || 'Unknown'}</TableCell>
                  <TableCell className="text-muted-foreground">{device.location || 'Unknown'}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {device.last_seen 
                      ? formatDistanceToNow(new Date(device.last_seen), { addSuffix: true })
                      : 'Never'}
                  </TableCell>
                  <TableCell>
                    {device.agent_version ? (
                      <code className="text-xs bg-secondary px-2 py-1 rounded text-muted-foreground">
                        v{device.agent_version}
                      </code>
                    ) : (
                      <span className="text-xs text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2" onClick={(e) => { e.stopPropagation(); navigate(`/devices/${device.id}`); }}>
                          <Eye className="h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <Settings className="h-4 w-4" />
                          Configure
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="gap-2 text-destructive focus:text-destructive"
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setDeviceToDelete(device);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove Device
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deviceToDelete} onOpenChange={(open) => !open && setDeviceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Device</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deviceToDelete?.hostname}</strong>? 
              This will permanently remove the device and all its associated data including screenshots, 
              sessions, and telemetry. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteDevice}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Device'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
