import { SekolahRepository, Sekolah } from '../repositories/sekolahRepository';

export class SekolahService {
  static async getAll(kelurahan?: string) {
    return await SekolahRepository.getAll(kelurahan);
  }

  static async getBlankSpots() {
    return await SekolahRepository.getBlankSpots();
  }

  static async create(sekolah: Sekolah) {
    return await SekolahRepository.create(sekolah);
  }

  static async getAsGeoJSON(kelurahan?: string) {
    const list = await SekolahRepository.getAll(kelurahan);

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
    const routes = await SekolahRepository.getSchoolRoute(id);
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
}
