import { SppgRepository, SPPG } from '../repositories/sppgRepository';
import { CoverageRepository } from '../repositories/coverageRepository';

export class SppgService {
  static async getAllSppg() {
    return await SppgRepository.getAll();
  }

  static async getSppgById(id: number) {
    return await SppgRepository.getById(id);
  }

  static async createSppg(sppg: SPPG) {
    const newSppg = await SppgRepository.create(sppg);
    
    // Regenerate service areas when SPPG changes
    if (newSppg && newSppg.id && newSppg.node_id) {
      await CoverageRepository.generateServiceAreaPolygon(newSppg.id, newSppg.node_id);
    }
    
    return newSppg;
  }

  static async getAsGeoJSON() {
    const list = await SppgRepository.getAll();
    const coverageAreaList = await CoverageRepository.getLuasCoverage();
    
    const coverageMap = new Map(coverageAreaList.map(item => [item.sppg_id, parseFloat(item.luas_coverage_km2)]));

    const features = list.map((item: any) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [item.longitude, item.latitude],
      },
      properties: {
        id: item.id,
        nama: item.nama_sppg,
        alamat: item.alamat,
        node_id: item.node_id,
        tipe: 'sppg',
        luas_coverage_km2: coverageMap.get(item.id) || 0,
      },
    }));

    return {
      type: 'FeatureCollection',
      features,
    };
  }
}
