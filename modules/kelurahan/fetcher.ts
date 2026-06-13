import axios from "axios";
import type { KelurahanStat, KelurahanCollection } from "./types";

export async function fetchKelurahanStats(): Promise<KelurahanStat[]> {
  const { data } = await axios.get<{ data: KelurahanStat[] }>("/api/kelurahan");
  return data.data || [];
}

export async function fetchKelurahanGeojson(): Promise<KelurahanCollection> {
  const { data } = await axios.get<KelurahanCollection>("/api/kelurahan/geojson");
  return data;
}
