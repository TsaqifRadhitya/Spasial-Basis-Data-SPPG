import axios from "axios";
import type { SekolahCollection, SekolahForm } from "./types";
import type { GeoJSONCollection } from "@/types/dashboard";

export async function fetchSekolahGeojson(): Promise<SekolahCollection> {
  const { data } = await axios.get<SekolahCollection>("/api/sekolah?format=geojson");
  return data;
}

export async function fetchSchoolRoute(id: string): Promise<GeoJSONCollection> {
  const { data } = await axios.get<GeoJSONCollection>(`/api/sekolah/${id}/routes`);
  return data;
}

export async function createSekolah(data: SekolahForm): Promise<void> {
  try {
    await axios.post("/api/sekolah", data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
}

export async function deleteSekolah(id: string): Promise<void> {
  try {
    await axios.delete(`/api/sekolah/${id}`);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
}
