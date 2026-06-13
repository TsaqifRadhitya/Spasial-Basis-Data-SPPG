import type { GeoJSONCollection } from "@/types/dashboard";

export interface PanjangJalanItem {
  sppg_id: string;
  nama_sppg: string;
  total_panjang_meter: number;
}

export interface DrivingDistanceItem {
  sekolah_id: string;
  nama_sekolah: string;
  nama_kelurahan: string | null;
  jenjang: string;
  sppg_id: string | null;
  nama_sppg: string | null;
  jarak_tempuh_meter: number;
  status_cakupan: "Terlayani" | "Blank Spot";
}

export interface CoverageStats {
  panjangJalan: PanjangJalanItem[];
  drivingDistances: DrivingDistanceItem[];
}

export type ServiceAreaCollection = GeoJSONCollection;
