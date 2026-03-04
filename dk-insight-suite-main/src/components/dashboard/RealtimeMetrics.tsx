import { useDashboardData } from "@/hooks/useDashboardData";
import { useDevices } from "@/hooks/useDevices";
import { Monitor, Wifi, Clock, Camera } from "lucide-react";

export function RealtimeMetrics() {
  const { data: dashboard } = useDashboardData();
  const { data: devices = [] } = useDevices();

  const online  = devices.filter((d: any) => d.status === "online").length;
  const idle    = devices.filter((d: any) => d.status === "idle").length;
  const offline = devices.filter((d: any) => d.status === "offline").length;

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-center gap-3">
        <Wifi className="h-5 w-5 text-green-400" />
        <div><p className="text-xs text-muted-foreground">Online</p><p className="text-lg font-bold text-green-400">{online}</p></div>
      </div>
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex items-center gap-3">
        <Clock className="h-5 w-5 text-yellow-400" />
        <div><p className="text-xs text-muted-foreground">Idle</p><p className="text-lg font-bold text-yellow-400">{idle}</p></div>
      </div>
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-3">
        <Monitor className="h-5 w-5 text-red-400" />
        <div><p className="text-xs text-muted-foreground">Offline</p><p className="text-lg font-bold text-red-400">{offline}</p></div>
      </div>
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 flex items-center gap-3">
        <Camera className="h-5 w-5 text-blue-400" />
        <div><p className="text-xs text-muted-foreground">Screenshots</p><p className="text-lg font-bold text-blue-400">{dashboard?.todayScreenshots ?? 0}</p></div>
      </div>
    </div>
  );
}