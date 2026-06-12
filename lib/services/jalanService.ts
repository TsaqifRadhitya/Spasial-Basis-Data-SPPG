import { JalanRepository } from '../repositories/jalanRepository';

export class JalanService {
  static async getJalanGeoJSON() {
    return await JalanRepository.getAllGeoJSON();
  }
}
