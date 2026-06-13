import type { GeoJSONFeature, GeoJSONCollection } from "@/types/dashboard";

export interface SppgProperties {
  id: string;
  nama: string;
  alamat: string;
  kelurahan: string | null;
  node_id: string | null;
  longitude: number;
  latitude: number;
  id_sppg?: never; // discriminator — not present on SPPG itself
}

export type SppgFeature = GeoJSONFeature<SppgProperties>;
export type SppgCollection = GeoJSONCollection<SppgProperties>;

export interface SppgForm {
  nama_sppg: string;
  alamat: string;
  longitude: string;
  latitude: string;
}
