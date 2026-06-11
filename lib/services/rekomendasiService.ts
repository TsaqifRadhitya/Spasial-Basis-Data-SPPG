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
    // 1. Calculate driving distances to determine which schools are served
    const distances = await CoverageRepository.calculateDrivingDistances();
    
    // Served school IDs are those with a network distance <= 6000 meters
    const servedSchoolIds = Array.from(new Set(
      distances
        .filter((d: any) => parseFloat(d.jarak_tempuh_meter) <= 6000)
        .map((d: any) => d.sekolah_id)
    ));

    // 2. Perform DBSCAN clustering on the remaining (blank spot) schools and find centroids
    await RekomendasiRepository.recalculateBlankSpots(servedSchoolIds);

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
