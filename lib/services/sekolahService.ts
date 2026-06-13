import { SekolahRepository, Sekolah } from '../repositories/sekolahRepository';
import { withRetry } from '../utils/withRetry';

interface SekolahRow {
  id: string;
  nama_sekolah: string;
  jenjang: 'SD' | 'SMP' | 'SMA' | 'SMK';
  alamat: string;
  nama_kelurahan: string | null;
  node_id: string | null;
  id_sppg: string | null;
  longitude: number;
  latitude: number;
  jalur_distribusi: object | null;
}

interface SekolahRouteRow {
  edge: number;
  path_seq: number;
  geometry: object;
}

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

    const features = list.map((item: SekolahRow) => {
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
    const features = routes.map((item: SekolahRouteRow) => ({
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
