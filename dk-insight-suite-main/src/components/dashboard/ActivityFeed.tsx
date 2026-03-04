import { useLiveFeed } from "@/hooks/useLiveFeed";
import { Monitor, Camera, Activity, Wifi, WifiOff } from "lucide-react";

export function ActivityFeed() {
  const { events, connected } = useLiveFeed();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">Live Activity Feed</span>
        </div>
        <div className="flex items-center gap-1.5">
          {connected
            ? <><Wifi className="h-3.5 w-3.5 text-green-400" /><span className="text-xs text-green-400">Live</span></>
            : <><WifiOff className="h-3.5 w-3.5 text-red-400" /><span className="text-xs text-red-400">Reconnecting...</span></>
          }
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
            <Activity className="h-8 w-8 opacity-30" />
            <p className="text-sm">No recent activity</p>
            <p className="text-xs opacity-60">Events will appear here in real-time</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {events.map(event => (
              <div key={event.id} className="p-3 hover:bg-white/5 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 p-1.5 rounded-full flex-shrink-0 ${
                    event.type === "device_enrolled" ? "bg-green-500/20 text-green-400"
                    : event.type === "screenshot" ? "bg-blue-500/20 text-blue-400"
                    : "bg-primary/20 text-primary"
                  }`}>
                    {event.type === "screenshot"
                      ? <Camera className="h-3 w-3" />
                      : <Monitor className="h-3 w-3" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{event.message}</p>
                    {event.url && (
                      <img
                        src={event.url}
                        alt="screenshot"
                        className="mt-2 rounded border border-white/10 max-h-32 w-full object-cover cursor-pointer"
                        onClick={() => window.open(event.url, "_blank")}
                      />
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {event.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
