import { useQuery } from "@tanstack/react-query";
import { auditApi } from "@/integrations/api/client";

export function useAuditLogs() {
  return useQuery({
    queryKey: ["audit-logs"],
    queryFn: () => auditApi.list(),
    refetchInterval: 60000,
  });
}