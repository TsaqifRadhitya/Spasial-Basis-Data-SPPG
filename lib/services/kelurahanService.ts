import { KelurahanRepository } from '../repositories/kelurahanRepository';
import { withRetry } from '../utils/withRetry';

interface KelurahanBoundaryRow {
  id: string;
  nama: string;
  kecamatan: string;
  total_sekolah: string | number;
  terlayani_count: string | number;
  blank_spot_count: string | number;
  tipe: "kelurahan" | "kecamatan";
  geometry: object;
}

export class KelurahanService {
  static async getKelurahanSummary() {
    return withRetry(() => KelurahanRepository.getAllWithCoverageSummary());
  }

  static async getAsGeoJSON() {
    const list = await withRetry(() => KelurahanRepository.getAdminBoundaries());

    const features = list.map((item: KelurahanBoundaryRow) => ({
      type: 'Feature',
      geometry: item.geometry,
      properties: {
        id: item.id,
        nama: item.nama,
        kecamatan: item.kecamatan,
        total_sekolah: typeof item.total_sekolah === 'string' ? parseInt(item.total_sekolah, 10) : item.total_sekolah,
        terlayani_count: typeof item.terlayani_count === 'string' ? parseInt(item.terlayani_count, 10) : item.terlayani_count,
        blank_spot_count: typeof item.blank_spot_count === 'string' ? parseInt(item.blank_spot_count, 10) : item.blank_spot_count,
        tipe: item.tipe,
      },
    }));

    return {
      type: 'FeatureCollection',
      features,
    };
  }
}
