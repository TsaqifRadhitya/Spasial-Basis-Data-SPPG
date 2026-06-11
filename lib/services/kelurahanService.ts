import { KelurahanRepository } from '../repositories/kelurahanRepository';

export class KelurahanService {
  static async getKelurahanSummary() {
    return await KelurahanRepository.getAllWithCoverageSummary();
  }

  static async getAsGeoJSON() {
    const list = await KelurahanRepository.getAllWithCoverageSummary();

    const features = list.map((item: any) => ({
      type: 'Feature',
      geometry: item.geometry,
      properties: {
        id: item.id,
        nama: item.nama_kelurahan,
        kecamatan: item.nama_kecamatan,
        total_sekolah: parseInt(item.total_sekolah, 10),
        terlayani_count: parseInt(item.terlayani_count, 10),
        blank_spot_count: parseInt(item.blank_spot_count, 10),
        tipe: 'kelurahan',
      },
    }));

    return {
      type: 'FeatureCollection',
      features,
    };
  }
}
