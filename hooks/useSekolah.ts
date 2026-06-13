import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchSekolahGeojson,
  fetchSchoolRoute,
  createSekolah,
  deleteSekolah,
} from "@/modules/sekolah/fetcher";

export function useSekolahQuery() {
  return useQuery({
    queryKey: ["sekolah", "geojson"],
    queryFn: fetchSekolahGeojson,
  });
}

export function useSchoolRouteQuery(id: string | null) {
  return useQuery({
    queryKey: ["sekolah", id, "routes"],
    queryFn: () => fetchSchoolRoute(id!),
    enabled: !!id,
  });
}

export function useAddSekolahMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSekolah,
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}

export function useDeleteSekolahMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSekolah,
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}
