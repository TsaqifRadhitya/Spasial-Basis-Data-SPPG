import { CoverageRepository } from '../repositories/coverageRepository';
import { withRetry } from '../utils/withRetry';

export class CoverageService {
  static async getPanjangJalan() {
    return withRetry(() => CoverageRepository.getPanjangJalanCoverage());
  }

  static async getDrivingDistances() {
    return withRetry(() => CoverageRepository.calculateDrivingDistances());
  }

  static async getServiceAreaGeoJSON() {
    const list = await withRetry(() => CoverageRepository.getServiceAreaPolygons());

    const features = list.map((item: any) => ({
      type: 'Feature',
      geometry: item.geometry,
      properties: {
        id: item.id,
        sppg_id: item.sppg_id,
        nama: item.nama_sppg,
        tipe: 'service_area',
        max_cost_meter: item.max_cost_meter,
      },
    }));

    return {
      type: 'FeatureCollection',
      features,
    };
  }
}
