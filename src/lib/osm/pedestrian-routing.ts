import type { LatLngLiteral } from "@/lib/dduim/types";

export type PedestrianRouteResult = {
  distanceKm: number | null;
  path: LatLngLiteral[];
};

export async function fetchPedestrianRoute(
  points: LatLngLiteral[],
  signal?: AbortSignal,
): Promise<PedestrianRouteResult | null> {
  const locations = compactWaypoints(points);
  if (locations.length < 2) return null;

  const response = await fetch("/api/routing/pedestrian", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ locations }),
    signal,
  });

  if (!response.ok) return null;
  return response.json() as Promise<PedestrianRouteResult>;
}

function compactWaypoints(points: LatLngLiteral[]): LatLngLiteral[] {
  const result: LatLngLiteral[] = [];
  for (const point of points) {
    const prev = result[result.length - 1];
    if (!prev || Math.abs(prev.lat - point.lat) > 0.000001 || Math.abs(prev.lng - point.lng) > 0.000001) {
      result.push(point);
    }
  }
  return result;
}
