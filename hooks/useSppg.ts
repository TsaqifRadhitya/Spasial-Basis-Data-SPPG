import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchSppgGeojson,
  fetchSppgRoutes,
  createSppg,
  deleteSppg,
} from "@/modules/sppg/fetcher";

export function useSppgQuery() {
  return useQuery({
    queryKey: ["sppg", "geojson"],
    queryFn: fetchSppgGeojson,
  });
}

export function useSppgRoutesQuery(id: string | null) {
  return useQuery({
    queryKey: ["sppg", id, "routes"],
    queryFn: () => fetchSppgRoutes(id!),
    enabled: !!id,
  });
}

export function useAddSppgMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSppg,
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}

export function useDeleteSppgMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSppg,
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}
