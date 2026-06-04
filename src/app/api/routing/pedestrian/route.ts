import { NextResponse } from "next/server";
import type { LatLngLiteral } from "@/lib/dduim/types";

type ValhallaRouteResponse = {
  trip?: {
    legs?: Array<{ shape?: string }>;
    summary?: { length?: number };
  };
};

const DEFAULT_VALHALLA_ROUTE_URL = "https://valhalla1.openstreetmap.de/route";
const MAX_WAYPOINTS = 24;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { locations?: LatLngLiteral[] } | null;
  const locations = body?.locations?.filter(isLatLng).slice(0, MAX_WAYPOINTS) ?? [];

  if (locations.length < 2) {
    return NextResponse.json({ error: "At least two locations are required." }, { status: 400 });
  }

  const endpoint = process.env.VALHALLA_ROUTE_URL || DEFAULT_VALHALLA_ROUTE_URL;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": process.env.OSM_USER_AGENT || "dduim-log/0.1",
    },
    body: JSON.stringify({
      costing: "pedestrian",
      directions_options: { units: "kilometers" },
      locations: locations.map((point) => ({ lat: point.lat, lon: point.lng, type: "break" })),
      units: "kilometers",
    }),
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Pedestrian routing failed." }, { status: 502 });
  }

  const data = (await response.json()) as ValhallaRouteResponse;
  const path = data.trip?.legs?.flatMap((leg) => leg.shape ? decodeValhallaShape(leg.shape) : []) ?? [];

  if (path.length < 2) {
    return NextResponse.json({ error: "Pedestrian route did not include a shape." }, { status: 502 });
  }

  const routeDistanceKm = calcGeoDistance(path);
  const waypointDistanceKm = calcGeoDistance(locations);
  const maxReasonableDistanceKm = Math.max(waypointDistanceKm * 6, waypointDistanceKm + 2.5);

  if (routeDistanceKm > maxReasonableDistanceKm) {
    return NextResponse.json({ error: "Pedestrian route was too indirect." }, { status: 502 });
  }

  return NextResponse.json({
    distanceKm: routeDistanceKm || data.trip?.summary?.length || null,
    path,
  });
}

function isLatLng(value: unknown): value is LatLngLiteral {
  if (!value || typeof value !== "object") return false;
  const point = value as Partial<LatLngLiteral>;
  return Number.isFinite(point.lat) && Number.isFinite(point.lng)
    && Math.abs(point.lat!) <= 90
    && Math.abs(point.lng!) <= 180;
}

function decodeValhallaShape(shape: string): LatLngLiteral[] {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates: LatLngLiteral[] = [];

  while (index < shape.length) {
    const latChange = decodeSignedValue(shape, index);
    index = latChange.nextIndex;
    const lngChange = decodeSignedValue(shape, index);
    index = lngChange.nextIndex;

    lat += latChange.value;
    lng += lngChange.value;
    coordinates.push({ lat: lat / 1e6, lng: lng / 1e6 });
  }

  return coordinates;
}

function decodeSignedValue(shape: string, startIndex: number) {
  let result = 0;
  let shift = 0;
  let index = startIndex;
  let byte = 0;

  do {
    byte = shape.charCodeAt(index++) - 63;
    result |= (byte & 0x1f) << shift;
    shift += 5;
  } while (byte >= 0x20 && index < shape.length);

  return {
    nextIndex: index,
    value: result & 1 ? ~(result >> 1) : result >> 1,
  };
}

function calcGeoDistance(points: LatLngLiteral[]): number {
  if (points.length < 2) return 0;

  const radiusKm = 6371;
  const toRad = (value: number) => value * Math.PI / 180;
  let total = 0;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const next = points[i];
    const dLat = toRad(next.lat - prev.lat);
    const dLng = toRad(next.lng - prev.lng);
    const lat1 = toRad(prev.lat);
    const lat2 = toRad(next.lat);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    total += 2 * radiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  return total;
}
