import { SppgRepository, SPPG } from '../repositories/sppgRepository';
import { CoverageRepository } from '../repositories/coverageRepository';
import { withRetry } from '../utils/withRetry';

interface SppgRow {
  id: string;
  nama_sppg: string;
  alamat: string;
  node_id: string | null;
  longitude: number;
  latitude: number;
  kelurahan: string | null;
}

interface SppgRouteRow {
  sekolah_id: string;
  edge: number;
  path_seq: number;
  geometry: object;
}

export class SppgService {
  static async getAllSppg() {
    return withRetry(() => SppgRepository.getAll());
  }

  static async getSppgById(id: string) {
    return withRetry(() => SppgRepository.getById(id));
  }

  static async createSppg(sppg: SPPG) {
    return withRetry(() => SppgRepository.create(sppg));
  }

  static async getAsGeoJSON() {
    const [list, coverageAreaList] = await Promise.all([
      withRetry(() => SppgRepository.getAll()),
      withRetry(() => CoverageRepository.getLuasCoverage()),
    ]);

    const coverageMap = new Map(coverageAreaList.map(item => [item.sppg_id, parseFloat(item.luas_coverage_km2)]));

    const features = list.map((item: SppgRow) => ({
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
    const routes = await withRetry(() => SppgRepository.getSppgRoutes(id));

    const features = routes.map((item: SppgRouteRow) => ({
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
    return withRetry(() => SppgRepository.delete(id));
  }
}
