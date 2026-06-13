import axios from "axios";
import type { JalanCollection } from "./types";

export async function fetchJalanGeojson(): Promise<JalanCollection> {
  const { data } = await axios.get<JalanCollection>("/api/jalan");
  return data;
}
