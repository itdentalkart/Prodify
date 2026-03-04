import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { devicesApi } from "@/integrations/api/client";

export function useDevices() {
  return useQuery({
    queryKey: ["devices"],
    queryFn: () => devicesApi.list(),
    refetchInterval: 15000,
  });
}

export function useDeleteDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => devicesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["devices"] }),
  });
}

export function useUpdateDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => devicesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["devices"] }),
  });
}