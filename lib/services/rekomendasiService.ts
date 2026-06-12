import { RekomendasiRepository } from '../repositories/rekomendasiRepository';
import { CoverageRepository } from '../repositories/coverageRepository';
import { SppgRepository } from '../repositories/sppgRepository';

export class RekomendasiService {
  static async getRekomendasi() {
    return await RekomendasiRepository.getAll();
  }

  static async getValidasi() {
    return await RekomendasiRepository.getValidasi();
  }

  static async generateRekomendasi() {
    return await this.getAsGeoJSON();
  }

  static async getAsGeoJSON() {
    const list = await RekomendasiRepository.getAll();

    const features = list.map((item: any) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [item.longitude, item.latitude],
      },
      properties: {
        id: item.id,
        kluster_id: item.kluster_id,
        jumlah_sekolah: parseInt(item.jumlah_sekolah, 10),
        tipe: 'rekomendasi',
      },
    }));

    return {
      type: 'FeatureCollection',
      features,
    };
  }
}
