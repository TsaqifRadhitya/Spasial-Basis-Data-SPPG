import { SekolahRepository, Sekolah } from '../repositories/sekolahRepository';
import { withRetry } from '../utils/withRetry';

export class SekolahService {
  static async getAll(kelurahan?: string) {
    return withRetry(() => SekolahRepository.getAll(kelurahan));
  }

  static async getBlankSpots() {
    return withRetry(() => SekolahRepository.getBlankSpots());
  }

  static async create(sekolah: Sekolah) {
    return withRetry(() => SekolahRepository.create(sekolah));
  }

  static async getAsGeoJSON(kelurahan?: string) {
    const list = await withRetry(() => SekolahRepository.getAll(kelurahan));

    const features = list.map((item: any) => {
      const isBlankSpot = !item.id_sppg;
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [item.longitude, item.latitude],
        },
        properties: {
          id: item.id,
          nama: item.nama_sekolah,
          jenjang: item.jenjang,
          alamat: item.alamat,
          kelurahan: item.nama_kelurahan,
          node_id: item.node_id,
          id_sppg: item.id_sppg,
          jalur_distribusi: item.jalur_distribusi ?? null,
          tipe: 'sekolah',
          status: isBlankSpot ? 'Blank Spot' : 'Terlayani',
        },
      };
    });

    return {
      type: 'FeatureCollection',
      features,
    };
  }

  static async getSchoolRouteGeoJSON(id: string) {
    const routes = await withRetry(() => SekolahRepository.getSchoolRoute(id));
    const features = routes.map((item: any) => ({
      type: 'Feature',
      geometry: item.geometry,
      properties: {
        edge: item.edge,
        path_seq: item.path_seq,
      },
    }));
    return {
      type: 'FeatureCollection',
      features,
    };
  }

  static async delete(id: string) {
    return withRetry(() => SekolahRepository.delete(id));
  }
}
