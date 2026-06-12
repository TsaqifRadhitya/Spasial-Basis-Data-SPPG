import { CoverageRepository } from '../repositories/coverageRepository';

export class CoverageService {
  static async getPanjangJalan() {
    return await CoverageRepository.getPanjangJalanCoverage();
  }

  static async getDrivingDistances() {
    return await CoverageRepository.calculateDrivingDistances();
  }

  static async getServiceAreaGeoJSON() {
    const list = await CoverageRepository.getServiceAreaPolygons();

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

  static async regenerateServiceAreas(sppgs: { id: string; node_id: number }[]) {
    // No-op (service areas are now dynamically computed on demand)
  }
}
