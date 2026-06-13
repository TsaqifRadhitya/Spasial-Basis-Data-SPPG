import { RekomendasiRepository } from '../repositories/rekomendasiRepository';
import { withRetry } from '../utils/withRetry';

export class RekomendasiService {
  static async getRekomendasi() {
    return withRetry(() => RekomendasiRepository.getAll());
  }

  static async getValidasi() {
    return withRetry(() => RekomendasiRepository.getValidasi());
  }

  static async generateRekomendasi() {
    return this.getAsGeoJSON();
  }

  static async getAsGeoJSON() {
    const list = await withRetry(() => RekomendasiRepository.getAll());

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
