import { Screenshot } from '@/types';
import { format } from 'date-fns';
import { Clock, Monitor, User, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScreenshotCardProps {
  screenshot: Screenshot;
  onView?: (screenshot: Screenshot) => void;
}

export function ScreenshotCard({ screenshot, onView }: ScreenshotCardProps) {
  return (
    <div className="glass-card rounded-xl overflow-hidden group transition-all duration-200 hover:border-primary/30">
      {/* Screenshot preview - placeholder gradient */}
      <div className="relative aspect-video bg-gradient-to-br from-secondary via-muted to-secondary">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Monitor className="h-12 w-12 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground/60 font-mono">
              {screenshot.deviceHostname}
            </p>
          </div>
        </div>
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => onView?.(screenshot)}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            View Full
          </Button>
        </div>
        
        {/* Time badge */}
        <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-md px-2 py-1 flex items-center gap-1">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs font-mono text-foreground">
            {format(screenshot.capturedAt, 'HH:mm')}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground">{screenshot.userName}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {format(screenshot.capturedAt, 'MMM dd, yyyy')}
          </span>
        </div>
        <p className="text-xs text-muted-foreground font-mono truncate">
          Session: {screenshot.sessionId.slice(0, 16)}...
        </p>
      </div>
    </div>
  );
}
