import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://192.168.11.90:3000";

interface LiveEvent {
  id: string;
  type: "device_enrolled" | "heartbeat" | "screenshot" | "connected";
  timestamp: Date;
  message: string;
  hostname?: string;
  url?: string;
}

export function useLiveFeed() {
  const { user } = useAuth();
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem("dk_token");
    if (!token) return;

    const connect = () => {
      const es = new EventSource(`${API_URL}/api/events/stream?token=${token}`);
      esRef.current = es;

      es.onopen = () => setConnected(true);

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === "connected") return;

          const event: LiveEvent = {
            id: Math.random().toString(36).slice(2),
            type: data.type,
            timestamp: new Date(),
            hostname: data.device?.hostname || data.screenshot?.hostname || "",
            message:
              data.type === "device_enrolled" ? `New device enrolled: ${data.device?.hostname}`
              : data.type === "heartbeat" ? `${data.device?.hostname} is ${data.device?.status}`
              : data.type === "screenshot" ? `Screenshot from ${data.screenshot?.hostname}`
              : data.type,
            url: data.screenshot?.url,
          };
          setEvents(prev => [event, ...prev].slice(0, 50));
        } catch {}
      };

      es.onerror = () => {
        setConnected(false);
        es.close();
        setTimeout(connect, 5000);
      };
    };

    connect();
    return () => { esRef.current?.close(); setConnected(false); };
  }, [user]);

  return { events, connected };
}
