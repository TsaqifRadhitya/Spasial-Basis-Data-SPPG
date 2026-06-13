import axios from "axios";

export interface GoogleRouteResult {
  distanceMeters: number;
  coordinates: [number, number][]; // [longitude, latitude] for PostGIS WKT
}

interface GoogleDirectionsResponse {
  status: string;
  routes: Array<{
    legs: Array<{
      distance: {
        value: number;
      };
    }>;
    overview_polyline: {
      points: string;
    };
  }>;
}

interface GoogleDistanceMatrixResponse {
  status: string;
  rows: Array<{
    elements: DistanceMatrixElement[];
  }>;
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
    const { data } = await axios.get<GoogleDirectionsResponse>(url);
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

export interface DistanceMatrixElement {
  status: string;
  distance?: {
    value: number; // meters
    text: string;
  };
  duration?: {
    value: number;
    text: string;
  };
}

/**
 * Fetches batch routing distance and duration from the Google Maps Distance Matrix API.
 * Returns null if the API key is not configured, or if the API call fails/returns no results.
 */
export async function getGoogleDistanceMatrix(
  origin: { lat: number; lng: number },
  destinations: { lat: number; lng: number }[]
): Promise<DistanceMatrixElement[] | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey || destinations.length === 0) {
    return null;
  }

  try {
    const destString = destinations.map(d => `${d.lat},${d.lng}`).join('|');
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.lat},${origin.lng}&destinations=${encodeURIComponent(destString)}&mode=driving&key=${apiKey}`;
    const { data } = await axios.get<GoogleDistanceMatrixResponse>(url);
    if (data.status !== 'OK' || !data.rows || data.rows.length === 0) {
      console.warn(`[GoogleMaps] Distance Matrix API returned status: ${data.status}`);
      return null;
    }

    return data.rows[0].elements;
  } catch (error) {
    console.error('[GoogleMaps] Error fetching distance matrix:', error);
    return null;
  }
}
