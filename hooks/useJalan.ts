import { useQuery } from "@tanstack/react-query";
import { fetchJalanGeojson } from "@/modules/jalan/fetcher";

export function useJalanQuery() {
  return useQuery({
    queryKey: ["jalan"],
    queryFn: fetchJalanGeojson,
  });
}
