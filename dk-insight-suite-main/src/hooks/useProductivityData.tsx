import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/integrations/api/client";

export function useProductivityData() {
  const { data, isLoading } = useQuery({
    queryKey: ["productivity"],
    queryFn: () => dashboardApi.get(),
    refetchInterval: 30000,
  });

  const timelineData = data?.timelineData ?? [];

  return { timelineData, loading: isLoading, data };
}