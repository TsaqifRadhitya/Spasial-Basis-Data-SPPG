import axios from "axios";
import type { SppgCollection, SppgForm } from "./types";
import type { GeoJSONCollection } from "@/types/dashboard";

export async function fetchSppgGeojson(): Promise<SppgCollection> {
  const { data } = await axios.get<SppgCollection>("/api/sppg?format=geojson");
  return data;
}

export async function fetchSppgRoutes(id: string): Promise<GeoJSONCollection> {
  const { data } = await axios.get<GeoJSONCollection>(`/api/sppg/${id}/routes`);
  return data;
}

export async function createSppg(data: SppgForm): Promise<void> {
  try {
    await axios.post("/api/sppg", data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
}

export async function deleteSppg(id: string): Promise<void> {
  try {
    await axios.delete(`/api/sppg/${id}`);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
}
