import axios from "axios";
import type { RekomendasiCollection, RekomendasiValidasiItem } from "./types";

export async function fetchRekomendasiGeojson(): Promise<RekomendasiCollection> {
  const { data } = await axios.get<RekomendasiCollection>("/api/rekomendasi?format=geojson");
  return data;
}

export async function fetchRekomendasiValidasi(): Promise<RekomendasiValidasiItem[]> {
  const { data } = await axios.get<{ data: RekomendasiValidasiItem[] }>("/api/rekomendasi/validasi");
  return data.data || [];
}

export async function recalculateRekomendasi(): Promise<RekomendasiCollection> {
  const { data } = await axios.post<RekomendasiCollection>("/api/rekomendasi/generate");
  return data;
}
