import { useQuery } from "@tanstack/react-query";
import { fetchCoverageStats, fetchServiceAreaGeojson } from "@/modules/coverage/fetcher";

export function useCoverageStatsQuery() {
  return useQuery({
    queryKey: ["coverage", "stats"],
    queryFn: fetchCoverageStats,
  });
}

export function useServiceAreaQuery() {
  return useQuery({
    queryKey: ["coverage", "service-area"],
    queryFn: fetchServiceAreaGeojson,
  });
}
