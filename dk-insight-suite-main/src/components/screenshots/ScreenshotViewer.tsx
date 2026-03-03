import { Screenshot } from '@/types';
import { format } from 'date-fns';
import { X, Monitor, User, Clock, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ScreenshotViewerProps {
  screenshot: Screenshot | null;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
}

export function ScreenshotViewer({ screenshot, onClose, onPrevious, onNext }: ScreenshotViewerProps) {
  if (!screenshot) return null;

  return (
    <Dialog open={!!screenshot} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden bg-background border-border">
        <DialogHeader className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <Monitor className="h-5 w-5 text-primary" />
              <span>{screenshot.deviceHostname}</span>
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={onPrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Screenshot Display */}
        <div className="relative aspect-video bg-gradient-to-br from-secondary via-muted to-secondary">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Monitor className="h-24 w-24 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground/50 text-lg">Screenshot Preview</p>
              <p className="text-xs text-muted-foreground/40 font-mono mt-2">
                {screenshot.filePath}
              </p>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="p-4 border-t border-border bg-card/50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">User</p>
                <p className="text-sm font-medium">{screenshot.userName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Captured</p>
                <p className="text-sm font-medium">
                  {format(screenshot.capturedAt, 'MMM dd, yyyy HH:mm:ss')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Device</p>
                <p className="text-sm font-medium">{screenshot.deviceHostname}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Session ID</p>
              <p className="text-sm font-mono truncate">{screenshot.sessionId}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
