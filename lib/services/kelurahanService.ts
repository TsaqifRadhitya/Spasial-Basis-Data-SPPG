import { KelurahanRepository } from '../repositories/kelurahanRepository';

export class KelurahanService {
  static async getKelurahanSummary() {
    return await KelurahanRepository.getAllWithCoverageSummary();
  }

  static async getAsGeoJSON() {
    const list = await KelurahanRepository.getAdminBoundaries();

    const features = list.map((item: any) => ({
      type: 'Feature',
      geometry: item.geometry,
      properties: {
        id: item.id,
        nama: item.nama,
        kecamatan: item.kecamatan,
        total_sekolah: parseInt(item.total_sekolah, 10),
        terlayani_count: parseInt(item.terlayani_count, 10),
        blank_spot_count: parseInt(item.blank_spot_count, 10),
        tipe: item.tipe,
      },
    }));

    return {
      type: 'FeatureCollection',
      features,
    };
  }
}
