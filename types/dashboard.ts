
export interface GeoJSONGeometry {
  type: string;
  coordinates: number[] | number[][] | number[][][];
}

export interface GeoJSONFeature<P = Record<string, unknown>> {
  type: "Feature";
  geometry: GeoJSONGeometry;
  properties: P;
}

export interface GeoJSONCollection<P = Record<string, unknown>> {
  type: "FeatureCollection";
  features: GeoJSONFeature<P>[];
}


export interface SppgProperties {
  id: string;
  nama: string;
  alamat: string;
  kelurahan: string | null;
  node_id: string | null;
  longitude: number;
  latitude: number;
  id_sppg?: never;
}

export type SppgFeature = GeoJSONFeature<SppgProperties>;
export type SppgCollection = GeoJSONCollection<SppgProperties>;

export interface SppgForm {
  nama_sppg: string;
  alamat: string;
  nama_kelurahan: string;
  longitude: string;
  latitude: string;
}


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


export interface KelurahanStat {
  id: string;
  nama_kelurahan: string;
  total_sekolah: number;
  terlayani_count: number;
  blank_spot_count: number;
  sppg_count: number;
}

export interface KelurahanFeatureProperties {
  nama: string;
  tipe: "kelurahan" | "kecamatan";
  kecamatan?: string;
  total_sekolah: number;
  terlayani_count: number;
  blank_spot_count: number;
  sppg_count: number;
}

export type KelurahanCollection = GeoJSONCollection<KelurahanFeatureProperties>;



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
  status_validasi: "Sangat Direkomendasikan" | "Terjangkau" | "Di luar jangkauan";
}


export interface DeleteModalState {
  isOpen: boolean;
  type: "sppg" | "sekolah";
  id: string;
  name: string;
}


export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}


export type ActiveTab = "map" | "sppg" | "sekolah" | "coverage" | "rekomendasi";
