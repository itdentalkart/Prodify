import { useQuery } from "@tanstack/react-query";
import { sessionsApi } from "@/integrations/api/client";

export function useSessions(params: { deviceId?: string; limit?: number } = {}) {
  return useQuery({
    queryKey: ["sessions", params],
    queryFn: () => sessionsApi.list(params),
    refetchInterval: 30000,
  });
}