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
    const blankSpots = await SekolahRepository.getBlankSpots();
    const blankSpotIds = new Set(blankSpots.map(item => item.id));

    const features = list.map((item: any) => {
      const isBlankSpot = blankSpotIds.has(item.id);
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
}
