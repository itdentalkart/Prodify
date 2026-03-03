import { useRealtimeDevices, RealtimeDevice } from '@/hooks/useRealtimeDevices';
import { formatDistanceToNow } from 'date-fns';
import { Monitor, Laptop, Clock, RefreshCw, Loader2, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface LiveDeviceItemProps {
  device: RealtimeDevice;
  onClick?: () => void;
}

function LiveDeviceItem({ device, onClick }: LiveDeviceItemProps) {
  const DeviceIcon = device.device_type === 'Laptop' ? Laptop : Monitor;
  
  const statusConfig = {
    online: { label: 'Online', class: 'bg-success text-success-foreground', dotClass: 'bg-success' },
    idle: { label: 'Idle', class: 'bg-warning text-warning-foreground', dotClass: 'bg-warning' },
    offline: { label: 'Offline', class: 'bg-destructive text-destructive-foreground', dotClass: 'bg-destructive' },
  };
  
  const status = device.status || 'offline';
  const config = statusConfig[status];

  return (
    <div 
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer group"
      onClick={onClick}
    >
      <div className="relative">
        <div className="rounded-lg bg-secondary p-2 group-hover:bg-secondary/80 transition-colors">
          <DeviceIcon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className={cn(
          'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background',
          config.dotClass,
          status === 'online' && 'animate-pulse'
        )} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground truncate">
            {device.hostname}
          </p>
          <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0', config.class)}>
            {config.label}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="truncate">
            {device.profiles?.display_name || device.profiles?.email || 'Unassigned'}
          </span>
          {device.last_seen && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1 whitespace-nowrap">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(device.last_seen), { addSuffix: true })}
              </span>
            </>
          )}
        </div>
      </div>
      
      {status === 'online' ? (
        <Wifi className="h-4 w-4 text-success" />
      ) : (
        <WifiOff className="h-4 w-4 text-muted-foreground" />
      )}
    </div>
  );
}

interface LiveDeviceStatusProps {
  className?: string;
  onDeviceClick?: (device: RealtimeDevice) => void;
}

export function LiveDeviceStatus({ className, onDeviceClick }: LiveDeviceStatusProps) {
  const { devices, loading, lastUpdate, refetch } = useRealtimeDevices();

  const onlineCount = devices.filter(d => d.status === 'online').length;
  const idleCount = devices.filter(d => d.status === 'idle').length;
  const offlineCount = devices.filter(d => d.status === 'offline').length;

  return (
    <div className={cn('glass-card rounded-xl', className)}>
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Monitor className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Live Device Status</h3>
          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Updated {formatDistanceToNow(lastUpdate, { addSuffix: true })}
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={refetch}
            disabled={loading}
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-2 p-4 border-b border-border/50">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-success" />
            <span className="text-lg font-bold text-foreground">{onlineCount}</span>
          </div>
          <p className="text-xs text-muted-foreground">Online</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-warning" />
            <span className="text-lg font-bold text-foreground">{idleCount}</span>
          </div>
          <p className="text-xs text-muted-foreground">Idle</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-destructive" />
            <span className="text-lg font-bold text-foreground">{offlineCount}</span>
          </div>
          <p className="text-xs text-muted-foreground">Offline</p>
        </div>
      </div>

      <ScrollArea className="h-[320px]">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : devices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Monitor className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No devices enrolled</p>
            <p className="text-xs text-muted-foreground">Enroll devices to see their status</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {devices.map((device) => (
              <LiveDeviceItem 
                key={device.id} 
                device={device}
                onClick={() => onDeviceClick?.(device)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
