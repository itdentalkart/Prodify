import { useQuery } from "@tanstack/react-query";
import { devicesApi, screenshotsApi, sessionsApi } from "@/integrations/api/client";

export function useDeviceDetails(deviceId: string) {
  const device = useQuery({
    queryKey: ["device", deviceId],
    queryFn: () => devicesApi.get(deviceId),
    enabled: !!deviceId,
  });
  const screenshots = useQuery({
    queryKey: ["screenshots", deviceId],
    queryFn: () => screenshotsApi.list({ deviceId, limit: 20 }),
    enabled: !!deviceId,
    refetchInterval: 30000,
  });
  const sessions = useQuery({
    queryKey: ["sessions", deviceId],
    queryFn: () => sessionsApi.list({ deviceId }),
    enabled: !!deviceId,
  });
  return { device, screenshots, sessions };
}