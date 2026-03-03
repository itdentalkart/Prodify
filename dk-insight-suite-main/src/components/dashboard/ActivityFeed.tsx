import { useActivityFeed, ActivityEvent } from '@/hooks/useActivityFeed';
import { formatDistanceToNow } from 'date-fns';
import { 
  Activity, 
  Monitor, 
  Camera, 
  Play, 
  Square, 
  Coffee, 
  Zap,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const getEventIcon = (eventType: string) => {
  switch (eventType) {
    case 'session_start':
      return Play;
    case 'session_end':
      return Square;
    case 'idle_start':
      return Coffee;
    case 'idle_end':
      return Zap;
    case 'screenshot':
      return Camera;
    case 'heartbeat':
      return Activity;
    default:
      return Monitor;
  }
};

const getEventColor = (eventType: string) => {
  switch (eventType) {
    case 'session_start':
      return 'text-success bg-success/10';
    case 'session_end':
      return 'text-destructive bg-destructive/10';
    case 'idle_start':
      return 'text-warning bg-warning/10';
    case 'idle_end':
      return 'text-info bg-info/10';
    case 'screenshot':
      return 'text-primary bg-primary/10';
    default:
      return 'text-muted-foreground bg-muted';
  }
};

const getEventLabel = (eventType: string) => {
  switch (eventType) {
    case 'session_start':
      return 'Session Started';
    case 'session_end':
      return 'Session Ended';
    case 'idle_start':
      return 'Went Idle';
    case 'idle_end':
      return 'Resumed Activity';
    case 'screenshot':
      return 'Screenshot Captured';
    case 'heartbeat':
      return 'Heartbeat';
    default:
      return eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
};

interface ActivityItemProps {
  activity: ActivityEvent;
}

function ActivityItem({ activity }: ActivityItemProps) {
  const Icon = getEventIcon(activity.eventType);
  const colorClass = getEventColor(activity.eventType);
  
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
      <div className={cn('rounded-lg p-2', colorClass)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground truncate">
            {getEventLabel(activity.eventType)}
          </p>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(activity.eventTime, { addSuffix: true })}
          </span>
        </div>
        {activity.deviceHostname && (
          <p className="text-xs text-muted-foreground truncate">
            {activity.deviceHostname}
          </p>
        )}
      </div>
    </div>
  );
}

interface ActivityFeedProps {
  className?: string;
  limit?: number;
}

export function ActivityFeed({ className, limit = 15 }: ActivityFeedProps) {
  const { activities, loading, refetch } = useActivityFeed(limit);

  return (
    <div className={cn('glass-card rounded-xl', className)}>
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Live Activity Feed</h3>
          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={refetch}
          disabled={loading}
        >
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
        </Button>
      </div>

      <ScrollArea className="h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
            <p className="text-xs text-muted-foreground">Events will appear here in real-time</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
