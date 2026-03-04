import { useQuery } from "@tanstack/react-query";
import { screenshotsApi } from "@/integrations/api/client";

export function useScreenshots(params: { deviceId?: string; from?: string; to?: string; limit?: number } = {}) {
  return useQuery({
    queryKey: ["screenshots", params],
    queryFn: () => screenshotsApi.list(params),
    refetchInterval: 30000,
  });
}