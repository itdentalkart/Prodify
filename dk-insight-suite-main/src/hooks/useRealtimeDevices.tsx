import { useQuery, useQueryClient } from "@tanstack/react-query";
import { devicesApi } from "@/integrations/api/client";
import { useEffect } from "react";
import { useLiveFeed } from "./useLiveFeed";

export function useRealtimeDevices() {
  const qc = useQueryClient();
  const { events } = useLiveFeed();

  const { data, isLoading, dataUpdatedAt, refetch } = useQuery({
    queryKey: ["devices"],
    queryFn: () => devicesApi.list(),
    refetchInterval: 15000,
  });

  // Refresh devices when heartbeat or enrollment event comes
  useEffect(() => {
    if (events.length > 0) {
      const latest = events[0];
      if (latest.type === "device_enrolled" || latest.type === "heartbeat") {
        qc.invalidateQueries({ queryKey: ["devices"] });
      }
    }
  }, [events]);

  const devices = Array.isArray(data) ? data : [];

  return {
    devices,
    loading: isLoading,
    lastUpdate: dataUpdatedAt ? new Date(dataUpdatedAt) : null,
    refetch,
  };
}