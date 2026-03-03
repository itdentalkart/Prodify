import { DeviceWithUser } from '@/hooks/useDevices';
import { cn } from '@/lib/utils';
import { Monitor, Laptop, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface DeviceStatusCardProps {
  device: DeviceWithUser;
  onClick?: () => void;
}

export function DeviceStatusCard({ device, onClick }: DeviceStatusCardProps) {
  const DeviceIcon = device.device_type === 'Laptop' ? Laptop : Monitor;
  const userName = device.profiles?.display_name || device.profiles?.email || 'Unassigned';
  
  return (
    <div 
      className="glass-card rounded-xl p-4 cursor-pointer transition-all duration-200 hover:border-primary/30 hover:shadow-lg"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-secondary p-2">
            <DeviceIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">{device.hostname}</h3>
            <p className="text-xs text-muted-foreground">{userName}</p>
          </div>
        </div>
        <div className={cn(
          'status-dot',
          device.status === 'online' && 'status-online',
          device.status === 'idle' && 'status-idle',
          device.status === 'offline' && 'status-offline',
        )} />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{device.os || 'Unknown'}</span>
          <span className="text-muted-foreground">{device.location || 'Unknown'}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>
            {device.last_seen 
              ? `Last seen ${formatDistanceToNow(new Date(device.last_seen), { addSuffix: true })}`
              : 'Never seen'}
          </span>
        </div>
      </div>
    </div>
  );
}
