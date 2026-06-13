import { useQuery } from "@tanstack/react-query";
import { fetchKelurahanStats, fetchKelurahanGeojson } from "@/modules/kelurahan/fetcher";

export function useKelurahanStatsQuery() {
  return useQuery({
    queryKey: ["kelurahan", "stats"],
    queryFn: fetchKelurahanStats,
  });
}

export function useKelurahanGeojsonQuery() {
  return useQuery({
    queryKey: ["kelurahan", "geojson"],
    queryFn: fetchKelurahanGeojson,
  });
}
