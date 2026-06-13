import { SppgRepository, SPPG } from '../repositories/sppgRepository';
import { CoverageRepository } from '../repositories/coverageRepository';

export class SppgService {
  static async getAllSppg() {
    return await SppgRepository.getAll();
  }

  static async getSppgById(id: string) {
    return await SppgRepository.getById(id);
  }

  static async createSppg(sppg: SPPG) {
    return await SppgRepository.create(sppg);
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
        kelurahan: item.kelurahan,
      },
    }));

    return {
      type: 'FeatureCollection',
      features,
    };
  }

  static async getSppgRoutesGeoJSON(id: string) {
    const routes = await SppgRepository.getSppgRoutes(id);
    
    const features = routes.map((item: any) => ({
      type: 'Feature',
      geometry: item.geometry,
      properties: {
        sekolah_id: item.sekolah_id,
        edge: item.edge,
        path_seq: item.path_seq,
      },
    }));
    return {
      type: 'FeatureCollection',
      features,
    };
  }

  static async deleteSppg(id: string) {
    return await SppgRepository.delete(id);
  }
}
