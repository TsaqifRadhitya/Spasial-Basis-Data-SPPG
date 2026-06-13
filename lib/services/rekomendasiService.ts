import { RekomendasiRepository } from '../repositories/rekomendasiRepository';
import { withRetry } from '../utils/withRetry';

interface RekomendasiRow {
  id: number;
  kluster_id: number;
  jumlah_sekolah: string | number;
  longitude: number;
  latitude: number;
}

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

    const features = list.map((item: RekomendasiRow) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [item.longitude, item.latitude],
      },
      properties: {
        id: item.id,
        kluster_id: item.kluster_id,
        jumlah_sekolah: typeof item.jumlah_sekolah === 'string' ? parseInt(item.jumlah_sekolah, 10) : item.jumlah_sekolah,
        tipe: 'rekomendasi' as const,
        longitude: item.longitude,
        latitude: item.latitude,
      },
    }));

    return {
      type: 'FeatureCollection',
      features,
    };
  }
}
