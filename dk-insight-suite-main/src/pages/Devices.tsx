import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { DeviceTable } from '@/components/devices/DeviceTable';
import { useDevices } from '@/hooks/useDevices';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Download, RefreshCw, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Devices() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { devices, loading, refetch } = useDevices();

  const filteredDevices = devices.filter(device =>
    device.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (device.profiles?.display_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (device.location || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onlineCount = devices.filter(d => d.status === 'online').length;
  const idleCount = devices.filter(d => d.status === 'idle').length;
  const offlineCount = devices.filter(d => d.status === 'offline').length;

  return (
    <MainLayout 
      title="Devices" 
      subtitle="Manage and monitor all enrolled devices"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Actions Bar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search devices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-secondary/50"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={refetch} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button size="sm" className="gap-2" onClick={() => navigate('/enrollment-tokens')}>
              <Plus className="h-4 w-4" />
              Enroll Device
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="glass-card rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Devices</p>
            <p className="text-2xl font-bold text-foreground">{devices.length}</p>
          </div>
          <div className="glass-card rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Online</p>
            <p className="text-2xl font-bold text-success">{onlineCount}</p>
          </div>
          <div className="glass-card rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Idle</p>
            <p className="text-2xl font-bold text-warning">{idleCount}</p>
          </div>
          <div className="glass-card rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Offline</p>
            <p className="text-2xl font-bold text-destructive">{offlineCount}</p>
          </div>
        </div>

        {/* Device Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : devices.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <p className="text-muted-foreground mb-4">No devices enrolled yet</p>
            <Button onClick={() => navigate('/enrollment-tokens')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Enrollment Token
            </Button>
          </div>
        ) : (
          <DeviceTable devices={filteredDevices} onDeviceDeleted={refetch} />
        )}
      </div>
    </MainLayout>
  );
}
