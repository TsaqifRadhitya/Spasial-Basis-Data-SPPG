import type { KelurahanCollection } from "@/types/dashboard";

export interface KelurahanStat {
  id: string;
  nama_kelurahan: string;
  total_sekolah: number;
  terlayani_count: number;
  blank_spot_count: number;
  sppg_count: number;
}

export type { KelurahanCollection };
