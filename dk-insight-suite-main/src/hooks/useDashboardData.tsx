import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/integrations/api/client";

export function useDashboardData() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => dashboardApi.get(),
    refetchInterval: 30000,
  });

  const metrics = {
    totalActiveTime: data?.totalActiveTime ?? 0,
    totalIdleTime: data?.totalIdleTime ?? 0,
    totalDevices: data?.totalDevices ?? 0,
    onlineDevices: data?.onlineDevices ?? 0,
    idleDevices: data?.idleDevices ?? 0,
    offlineDevices: data?.offlineDevices ?? 0,
    todayScreenshots: data?.todayScreenshots ?? 0,
    recentEvents: data?.recentEvents ?? [],
    activeSessions: data?.activeSessions ?? 0,
    productivityScore: data?.productivityScore ?? 0,
  };

  return { metrics, loading: isLoading, data };
}