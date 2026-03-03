import { useState, useMemo } from 'react';
import { Screenshot } from '@/types';
import { ScreenshotCard } from './ScreenshotCard';
import { format, isToday, isYesterday, startOfDay } from 'date-fns';
import { Calendar, Filter, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDevices } from '@/hooks/useDevices';

interface ScreenshotTimelineProps {
  screenshots: Screenshot[];
  onViewScreenshot?: (screenshot: Screenshot) => void;
}

export function ScreenshotTimeline({ screenshots, onViewScreenshot }: ScreenshotTimelineProps) {
  const { devices } = useDevices();
  const [selectedDevice, setSelectedDevice] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');

  const filteredScreenshots = useMemo(() => {
    return screenshots.filter(ss => {
      if (selectedDevice !== 'all' && ss.deviceId !== selectedDevice) return false;
      return true;
    });
  }, [screenshots, selectedDevice, selectedUser]);

  // Group by date
  const groupedScreenshots = useMemo(() => {
    const groups: Record<string, Screenshot[]> = {};
    
    filteredScreenshots.forEach(ss => {
      const dateKey = startOfDay(ss.capturedAt).toISOString();
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(ss);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .map(([date, items]) => ({
        date: new Date(date),
        items: items.sort((a, b) => b.capturedAt.getTime() - a.capturedAt.getTime()),
      }));
  }, [filteredScreenshots]);

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'EEEE, MMM dd, yyyy');
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="glass-card rounded-xl p-4 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>Filter by:</span>
        </div>

        <Select value={selectedDevice} onValueChange={setSelectedDevice}>
          <SelectTrigger className="w-48 bg-secondary/50">
            <SelectValue placeholder="All Devices" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Devices</SelectItem>
            {devices.map(d => (
              <SelectItem key={d.id} value={d.id}>{d.hostname}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" className="gap-2">
          <Calendar className="h-4 w-4" />
          Date Range
          <ChevronDown className="h-3 w-3" />
        </Button>

        <div className="ml-auto text-sm text-muted-foreground">
          {filteredScreenshots.length} screenshots
        </div>
      </div>

      {/* Timeline */}
      {groupedScreenshots.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <p className="text-muted-foreground">No screenshots captured yet</p>
          <p className="text-sm text-muted-foreground mt-2">Screenshots will appear once devices start reporting</p>
        </div>
      ) : (
        groupedScreenshots.map(group => (
          <div key={group.date.toISOString()} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <h3 className="text-sm font-medium text-muted-foreground px-3">
                {getDateLabel(group.date)}
              </h3>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {group.items.map(ss => (
                <ScreenshotCard
                  key={ss.id}
                  screenshot={ss}
                  onView={onViewScreenshot}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
