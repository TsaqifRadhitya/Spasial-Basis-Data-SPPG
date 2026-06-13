import type { GeoJSONFeature, GeoJSONCollection } from "@/types/dashboard";

export interface RekomendasiProperties {
  id: number;
  kluster_id: number;
  jumlah_sekolah: number;
  longitude: number;
  latitude: number;
}

export type RekomendasiFeature = GeoJSONFeature<RekomendasiProperties>;
export type RekomendasiCollection = GeoJSONCollection<RekomendasiProperties>;

export interface RekomendasiValidasiItem {
  kluster_id: number;
  nama_sekolah: string;
  jarak_meter: number;
  status_validasi: "Terjangkau" | "Di luar jangkauan";
}
