export interface GoogleRouteResult {
  distanceMeters: number;
  coordinates: [number, number][]; // [longitude, latitude] for PostGIS WKT
}

/**
 * Decodes a Google encoded polyline string into an array of [longitude, latitude] coordinates.
 */
export function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += dlng;

    points.push([lng * 1e-5, lat * 1e-5]);
  }
  return points;
}

/**
 * Fetches routing information from the Google Maps Directions API.
 * Returns null if the API key is not configured, or if the API call fails/returns no results.
 */
export async function getGoogleRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<GoogleRouteResult | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return null;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&mode=driving&key=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`[GoogleMaps] API HTTP Error: ${response.statusText}`);
      return null;
    }
    const data = await response.json();
    if (data.status !== 'OK' || !data.routes || data.routes.length === 0) {
      console.warn(`[GoogleMaps] Directions API returned status: ${data.status}`);
      return null;
    }

    const route = data.routes[0];
    const leg = route.legs[0];
    const distanceMeters = leg.distance.value;
    const polyline = route.overview_polyline.points;
    const coordinates = decodePolyline(polyline);

    return {
      distanceMeters,
      coordinates,
    };
  } catch (error) {
    console.error('[GoogleMaps] Error fetching route:', error);
    return null;
  }
}
