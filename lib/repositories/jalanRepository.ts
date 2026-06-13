export class JalanRepository {
  static async getAllGeoJSON() {
    // Return empty FeatureCollection since road network table is removed
    return {
      type: 'FeatureCollection',
      features: [],
    };
  }
}
