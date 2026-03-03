import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useDeviceDetails } from '@/hooks/useDeviceDetails';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  Monitor, 
  Clock, 
  Activity, 
  Camera, 
  User,
  MapPin,
  Cpu,
  Wifi,
  WifiOff,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  History
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export default function DeviceDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { device, sessions, screenshots, telemetry, loading, error, refetch, getScreenshotUrl } = useDeviceDetails(id);
  
  const [selectedScreenshot, setSelectedScreenshot] = useState<number | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [loadingScreenshot, setLoadingScreenshot] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Update time display every second
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleViewScreenshot = async (index: number) => {
    setSelectedScreenshot(index);
    setLoadingScreenshot(true);
    const url = await getScreenshotUrl(screenshots[index].file_path);
    setScreenshotUrl(url);
    setLoadingScreenshot(false);
  };

  const handleNavigateScreenshot = async (direction: 'prev' | 'next') => {
    if (selectedScreenshot === null) return;
    const newIndex = direction === 'prev' ? selectedScreenshot - 1 : selectedScreenshot + 1;
    if (newIndex >= 0 && newIndex < screenshots.length) {
      await handleViewScreenshot(newIndex);
    }
  };

  const getStatusBadge = (status: string | null) => {
    const statusValue = status || 'offline';
    const styles: Record<string, string> = {
      online: 'bg-success/10 text-success border-success/20',
      idle: 'bg-warning/10 text-warning border-warning/20',
      offline: 'bg-destructive/10 text-destructive border-destructive/20',
    };

    return (
      <Badge variant="outline" className={cn('gap-1.5', styles[statusValue])}>
        <span className={cn(
          'w-2 h-2 rounded-full',
          statusValue === 'online' && 'bg-success animate-pulse',
          statusValue === 'idle' && 'bg-warning',
          statusValue === 'offline' && 'bg-destructive',
        )} />
        {statusValue.charAt(0).toUpperCase() + statusValue.slice(1)}
      </Badge>
    );
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'session_start': return <Play className="h-4 w-4 text-success" />;
      case 'session_end': return <Pause className="h-4 w-4 text-destructive" />;
      case 'screenshot': return <Camera className="h-4 w-4 text-primary" />;
      case 'idle': return <Clock className="h-4 w-4 text-warning" />;
      case 'active': return <Activity className="h-4 w-4 text-success" />;
      default: return <History className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <MainLayout title="Device Details" subtitle="Loading...">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error || !device) {
    return (
      <MainLayout title="Device Details" subtitle="Error">
        <div className="glass-card rounded-xl p-12 text-center">
          <p className="text-destructive mb-4">{error || 'Device not found'}</p>
          <Button onClick={() => navigate('/devices')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Devices
          </Button>
        </div>
      </MainLayout>
    );
  }

  const totalActiveTime = sessions.reduce((sum, s) => sum + (s.active_seconds || 0), 0);
  const totalIdleTime = sessions.reduce((sum, s) => sum + (s.idle_seconds || 0), 0);
  const activeSessions = sessions.filter(s => !s.session_end).length;

  return (
    <MainLayout 
      title={device.hostname}
      subtitle={
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5">
            <Wifi className={cn(
              "h-3.5 w-3.5",
              device.status === 'online' ? 'text-success animate-pulse' : 'text-muted-foreground'
            )} />
            Real-time monitoring active
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground text-xs">
            Updated {formatDistanceToNow(lastUpdate, { addSuffix: true })}
          </span>
        </div>
      }
    >
      <div className="space-y-6 animate-fade-in">
        {/* Back button and actions */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/devices')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Devices
          </Button>
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Device Info Card */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10">
                <Monitor className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="mt-1">{getStatusBadge(device.status)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Seen</p>
                    <p className="text-sm font-medium">
                      {device.last_seen 
                        ? formatDistanceToNow(new Date(device.last_seen), { addSuffix: true })
                        : 'Never'
                      }
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Operating System</p>
                      <p className="text-sm font-medium">{device.os || 'Unknown'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="text-sm font-medium">{device.location || 'Not set'}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Assigned User</p>
                      <p className="text-sm font-medium">
                        {device.profiles?.display_name || device.profiles?.email || 'Unassigned'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Agent Version</p>
                    <p className="text-sm font-medium">{device.agent_version || 'Unknown'}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Active Sessions</p>
                  <p className="text-xl font-bold">{activeSessions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <Clock className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Active</p>
                  <p className="text-xl font-bold">{formatDuration(totalActiveTime)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <Clock className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Idle</p>
                  <p className="text-xl font-bold">{formatDuration(totalIdleTime)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                  <Camera className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Screenshots</p>
                  <p className="text-xl font-bold">{screenshots.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="history" className="w-full">
          <TabsList className="glass-card">
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              Activity History
            </TabsTrigger>
            <TabsTrigger value="sessions" className="gap-2">
              <Activity className="h-4 w-4" />
              Sessions ({sessions.length})
            </TabsTrigger>
            <TabsTrigger value="screenshots" className="gap-2">
              <Camera className="h-4 w-4" />
              Screenshots ({screenshots.length})
            </TabsTrigger>
          </TabsList>

          {/* Activity History Tab */}
          <TabsContent value="history" className="mt-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Real-time Activity Feed
                  {device.status === 'online' && (
                    <span className="flex items-center gap-1.5 text-xs font-normal text-success">
                      <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                      Live
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {telemetry.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No activity recorded yet</p>
                  </div>
                ) : (
                  <div className="space-y-1 max-h-[500px] overflow-y-auto">
                    {telemetry.map((event, index) => (
                      <div 
                        key={event.id} 
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg transition-colors",
                          index === 0 && "bg-primary/5 border border-primary/10"
                        )}
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                          {getEventIcon(event.event_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium capitalize">
                            {event.event_type.replace(/_/g, ' ')}
                          </p>
                          {event.details && Object.keys(event.details as object).length > 0 && (
                            <p className="text-xs text-muted-foreground truncate">
                              {JSON.stringify(event.details)}
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground whitespace-nowrap">
                          {event.event_time 
                            ? formatDistanceToNow(new Date(event.event_time), { addSuffix: true })
                            : 'Unknown'
                          }
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="mt-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Session History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sessions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No sessions recorded yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sessions.map((session, index) => (
                      <div 
                        key={session.id} 
                        className={cn(
                          "p-4 rounded-lg border",
                          !session.session_end 
                            ? "bg-success/5 border-success/20" 
                            : "bg-secondary/50 border-transparent"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {!session.session_end ? (
                              <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse mr-1.5" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-muted text-muted-foreground">
                                Completed
                              </Badge>
                            )}
                            {session.profiles && (
                              <span className="text-sm text-muted-foreground">
                                {session.profiles.display_name || session.profiles.email}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {session.session_start 
                              ? format(new Date(session.session_start), 'MMM d, yyyy h:mm a')
                              : 'Unknown'
                            }
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs">Duration</p>
                            <p className="font-medium">
                              {session.session_end 
                                ? formatDuration((session.active_seconds || 0) + (session.idle_seconds || 0))
                                : 'Ongoing'
                              }
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Active Time</p>
                            <p className="font-medium text-success">{formatDuration(session.active_seconds)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Idle Time</p>
                            <p className="font-medium text-warning">{formatDuration(session.idle_seconds)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Screenshots Tab */}
          <TabsContent value="screenshots" className="mt-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Screenshots
                </CardTitle>
              </CardHeader>
              <CardContent>
                {screenshots.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Camera className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No screenshots captured yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {screenshots.map((screenshot, index) => (
                      <div 
                        key={screenshot.id}
                        className="group relative aspect-video bg-secondary rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                        onClick={() => handleViewScreenshot(index)}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center">
                          <Camera className="h-6 w-6 text-muted-foreground/50" />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                          <p className="text-xs text-white/80 truncate">
                            {screenshot.captured_at 
                              ? format(new Date(screenshot.captured_at), 'h:mm a')
                              : 'Unknown'
                            }
                          </p>
                        </div>
                        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <span className="text-xs font-medium bg-background/80 px-2 py-1 rounded">View</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Screenshot Dialog */}
        <Dialog open={selectedScreenshot !== null} onOpenChange={() => setSelectedScreenshot(null)}>
          <DialogContent className="max-w-5xl p-0 overflow-hidden">
            <div className="relative">
              {loadingScreenshot ? (
                <div className="flex items-center justify-center h-[60vh] bg-secondary">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : screenshotUrl ? (
                <img 
                  src={screenshotUrl} 
                  alt="Screenshot" 
                  className="w-full h-auto max-h-[80vh] object-contain bg-black"
                />
              ) : (
                <div className="flex items-center justify-center h-[60vh] bg-secondary">
                  <p className="text-muted-foreground">Failed to load screenshot</p>
                </div>
              )}
              
              {selectedScreenshot !== null && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                    onClick={() => handleNavigateScreenshot('prev')}
                    disabled={selectedScreenshot === 0}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                    onClick={() => handleNavigateScreenshot('next')}
                    disabled={selectedScreenshot === screenshots.length - 1}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 px-4 py-2 rounded-lg">
                    <p className="text-sm">
                      {selectedScreenshot + 1} / {screenshots.length}
                      {screenshots[selectedScreenshot]?.captured_at && (
                        <span className="text-muted-foreground ml-2">
                          • {format(new Date(screenshots[selectedScreenshot].captured_at), 'MMM d, yyyy h:mm a')}
                        </span>
                      )}
                    </p>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
