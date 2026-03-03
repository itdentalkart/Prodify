import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, Monitor, Calendar as CalendarIcon, Loader2, ChevronLeft, ChevronRight, X, Image } from 'lucide-react';
import { format } from 'date-fns';
import { useScreenshots, ScreenshotWithDevice } from '@/hooks/useScreenshots';
import { cn } from '@/lib/utils';

export default function Screenshots() {
  const {
    screenshots,
    loading,
    devices,
    selectedDevice,
    setSelectedDevice,
    dateRange,
    setDateRange,
    getScreenshotUrl,
  } = useScreenshots();

  const [selectedScreenshot, setSelectedScreenshot] = useState<ScreenshotWithDevice | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);

  // Group screenshots by date
  const groupedScreenshots = screenshots.reduce((groups, ss) => {
    const date = format(new Date(ss.captured_at), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(ss);
    return groups;
  }, {} as Record<string, ScreenshotWithDevice[]>);

  const sortedDates = Object.keys(groupedScreenshots).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  const handleViewScreenshot = async (ss: ScreenshotWithDevice) => {
    setSelectedScreenshot(ss);
    setLoadingUrl(true);
    const url = await getScreenshotUrl(ss.file_path);
    setScreenshotUrl(url);
    setLoadingUrl(false);
  };

  const handleNavigation = async (direction: 'prev' | 'next') => {
    if (!selectedScreenshot) return;
    
    const currentIndex = screenshots.findIndex(s => s.id === selectedScreenshot.id);
    const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex >= 0 && newIndex < screenshots.length) {
      const newScreenshot = screenshots[newIndex];
      setSelectedScreenshot(newScreenshot);
      setLoadingUrl(true);
      const url = await getScreenshotUrl(newScreenshot.file_path);
      setScreenshotUrl(url);
      setLoadingUrl(false);
    }
  };

  const currentIndex = selectedScreenshot 
    ? screenshots.findIndex(s => s.id === selectedScreenshot.id) 
    : -1;

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return 'Today';
    } else if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
      return 'Yesterday';
    }
    return format(date, 'MMMM d, yyyy');
  };

  return (
    <MainLayout 
      title="Screenshots" 
      subtitle="Browse and review captured screenshots"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Filters */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-muted-foreground" />
                <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Devices" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Devices</SelectItem>
                    {devices.map(device => (
                      <SelectItem key={device.id} value={device.id}>
                        {device.hostname}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-48 justify-start">
                      {dateRange.from ? (
                        format(dateRange.from, 'MMM d, yyyy')
                      ) : (
                        'From date'
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.from || undefined}
                      onSelect={(date) => setDateRange(prev => ({ ...prev, from: date || null }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                
                <span className="text-muted-foreground">to</span>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-48 justify-start">
                      {dateRange.to ? (
                        format(dateRange.to, 'MMM d, yyyy')
                      ) : (
                        'To date'
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.to || undefined}
                      onSelect={(date) => setDateRange(prev => ({ ...prev, to: date || null }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                {(dateRange.from || dateRange.to) && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setDateRange({ from: null, to: null })}
                  >
                    Clear
                  </Button>
                )}
              </div>

              <div className="ml-auto text-sm text-muted-foreground">
                {screenshots.length} screenshot{screenshots.length !== 1 ? 's' : ''}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Screenshots Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : screenshots.length === 0 ? (
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardContent className="p-12 text-center">
              <Camera className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <p className="text-muted-foreground">No screenshots found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Screenshots will appear here once devices start capturing them
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {sortedDates.map(dateStr => (
              <div key={dateStr}>
                <h3 className="text-lg font-semibold mb-4">{getDateLabel(dateStr)}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {groupedScreenshots[dateStr].map(ss => (
                    <Card 
                      key={ss.id}
                      className="border-border/50 bg-card/50 backdrop-blur overflow-hidden cursor-pointer hover:border-primary/50 transition-colors group"
                      onClick={() => handleViewScreenshot(ss)}
                    >
                      <div className="aspect-video bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center relative">
                        <Image className="w-8 h-8 text-muted-foreground/50" />
                        <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-sm font-medium">View</span>
                        </div>
                      </div>
                      <CardContent className="p-3">
                        <p className="text-xs font-medium truncate">{ss.device_hostname}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(ss.captured_at), 'h:mm a')}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Screenshot Viewer Dialog */}
        <Dialog open={!!selectedScreenshot} onOpenChange={() => setSelectedScreenshot(null)}>
          <DialogContent className="max-w-5xl max-h-[90vh] p-0">
            <DialogHeader className="p-4 pb-0">
              <DialogTitle className="flex items-center justify-between">
                <span>
                  {selectedScreenshot?.device_hostname} - {selectedScreenshot && format(new Date(selectedScreenshot.captured_at), 'PPpp')}
                </span>
              </DialogTitle>
            </DialogHeader>
            
            <div className="relative flex-1 min-h-[400px] flex items-center justify-center bg-muted/50 m-4 mt-2 rounded-lg">
              {loadingUrl ? (
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              ) : screenshotUrl ? (
                <img 
                  src={screenshotUrl} 
                  alt="Screenshot" 
                  className="max-w-full max-h-[60vh] object-contain rounded"
                />
              ) : (
                <div className="text-center text-muted-foreground">
                  <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Failed to load screenshot</p>
                </div>
              )}

              {/* Navigation */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2"
                onClick={() => handleNavigation('prev')}
                disabled={currentIndex <= 0}
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => handleNavigation('next')}
                disabled={currentIndex >= screenshots.length - 1}
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </div>

            <div className="p-4 pt-0 text-sm text-muted-foreground text-center">
              {currentIndex + 1} of {screenshots.length}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
