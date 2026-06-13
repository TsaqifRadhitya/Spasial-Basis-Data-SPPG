import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchRekomendasiGeojson,
  fetchRekomendasiValidasi,
  recalculateRekomendasi,
} from "@/modules/rekomendasi/fetcher";

export function useRekomendasiQuery() {
  return useQuery({
    queryKey: ["rekomendasi", "geojson"],
    queryFn: fetchRekomendasiGeojson,
  });
}

export function useRekomendasiValidasiQuery() {
  return useQuery({
    queryKey: ["rekomendasi", "validasi"],
    queryFn: fetchRekomendasiValidasi,
  });
}

export function useRecalculateRekomendasiMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: recalculateRekomendasi,
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}
