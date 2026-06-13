import type { GeoJSONFeature, GeoJSONCollection } from "@/types/dashboard";

export interface SekolahProperties {
  id: string;
  nama: string;
  jenjang: "SD" | "SMP" | "SMA" | "SMK";
  alamat: string;
  kelurahan: string | null;
  id_sppg: string | null;
  jalur_distribusi: object | null;
}

export type SekolahFeature = GeoJSONFeature<SekolahProperties>;
export type SekolahCollection = GeoJSONCollection<SekolahProperties>;

export interface SekolahForm {
  nama_sekolah: string;
  jenjang: "SD" | "SMP" | "SMA" | "SMK";
  alamat: string;
  nama_kelurahan: string;
  longitude: string;
  latitude: string;
}
