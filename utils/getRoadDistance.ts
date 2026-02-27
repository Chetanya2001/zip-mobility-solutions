/**
 * getRoadDistance.ts
 * Real road distance & duration via OSRM — no Leaflet, works in Expo.
 */

export interface RoadDistanceResult {
  distanceKm: number;
  durationMin: number;
}

export async function getRoadDistance(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): Promise<RoadDistanceResult> {
  // OSRM expects lng,lat order (NOT lat,lng)
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${from.lng},${from.lat};${to.lng},${to.lat}` +
    `?overview=false&steps=false`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`OSRM request failed with status ${response.status}`);
  }

  const data = await response.json();

  if (data.code !== "Ok" || !data.routes?.length) {
    throw new Error(data.message || "No route found between these locations");
  }

  const route = data.routes[0];

  return {
    distanceKm: +(route.distance / 1000).toFixed(2), // metres → km
    durationMin: Math.round(route.duration / 60), // seconds → minutes
  };
}
