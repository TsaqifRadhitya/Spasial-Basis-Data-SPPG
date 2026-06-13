import axios from "axios";
import type { CoverageStats, ServiceAreaCollection } from "./types";

export async function fetchCoverageStats(): Promise<CoverageStats> {
  const { data } = await axios.get<CoverageStats>("/api/coverage");
  return data;
}

export async function fetchServiceAreaGeojson(): Promise<ServiceAreaCollection> {
  const { data } = await axios.get<ServiceAreaCollection>("/api/coverage/service-area");
  return data;
}
