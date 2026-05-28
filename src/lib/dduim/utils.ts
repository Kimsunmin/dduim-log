import type { LatLngLiteral, NormalizedPoint } from "./types";

export function readJson<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || "") as T; }
  catch { return fallback; }
}

export function smoothedPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return "";
  const p = points.map(pt => ({ x: pt.x * 100, y: pt.y * 100 }));
  if (p.length === 1) return `M ${p[0].x} ${p[0].y}`;
  if (p.length === 2) return `M ${p[0].x} ${p[0].y} L ${p[1].x} ${p[1].y}`;
  let d = `M ${p[0].x} ${p[0].y}`;
  for (let i = 1; i < p.length - 1; i++) {
    const mx = (p[i].x + p[i + 1].x) / 2, my = (p[i].y + p[i + 1].y) / 2;
    d += ` Q ${p[i].x} ${p[i].y} ${mx} ${my}`;
  }
  d += ` T ${p[p.length - 1].x} ${p[p.length - 1].y}`;
  return d;
}

export function calcDistance(points: Array<{ x: number; y: number }>, aspect = 1.0): number {
  if (points.length < 2) return 0;
  const span = 2400;
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = (points[i].x - points[i - 1].x) * span;
    const dy = (points[i].y - points[i - 1].y) * span * aspect;
    total += Math.sqrt(dx * dx + dy * dy);
  }
  return total / 1000;
}

export function calcGeoDistance(points: LatLngLiteral[]): number {
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

export function createCourseId(title: string, points: Array<{ x: number; y: number }>, distance: number): string {
  const slug = (title.trim() || "course").replace(/[^\w가-힣]+/g, "-").replace(/^-|-$/g, "").slice(0, 18);
  const shape = points.slice(0, 4).map(p => `${Math.round(p.x * 100)}${Math.round(p.y * 100)}`).join("-");
  return `mine-${slug}-${Math.round(distance * 1000)}-${shape}`;
}

export function deriveNormalizedPath(geoPoints: LatLngLiteral[]): NormalizedPoint[] {
  if (geoPoints.length === 0) return [];
  if (geoPoints.length === 1) return [{ x: 0.5, y: 0.5 }];
  const lats = geoPoints.map(p => p.lat);
  const lngs = geoPoints.map(p => p.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const latRange = maxLat - minLat || 0.001;
  const lngRange = maxLng - minLng || 0.001;
  return geoPoints.map(p => ({
    x: (p.lng - minLng) / lngRange,
    y: 1 - (p.lat - minLat) / latRange,
  }));
}

/** 두 좌표 간 Haversine 거리 (km) */
function segmentKm(a: LatLngLiteral, b: LatLngLiteral): number {
  const R = 6371;
  const toRad = (v: number) => v * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinA = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(sinA), Math.sqrt(1 - sinA));
}

/**
 * 경로에서 intervalKm 간격마다의 지리 좌표를 반환합니다.
 * 예: intervalKm=1 → 1km, 2km, 3km … 지점
 */
export function getKmMarkerPoints(
  geoPath: LatLngLiteral[],
  intervalKm = 1,
): Array<{ point: LatLngLiteral; km: number }> {
  if (geoPath.length < 2) return [];

  const results: Array<{ point: LatLngLiteral; km: number }> = [];
  let accumulated = 0;
  let nextThreshold = intervalKm;

  for (let i = 1; i < geoPath.length; i++) {
    const segDist = segmentKm(geoPath[i - 1], geoPath[i]);

    while (segDist > 0 && accumulated + segDist >= nextThreshold) {
      const t = (nextThreshold - accumulated) / segDist;
      results.push({
        point: {
          lat: geoPath[i - 1].lat + t * (geoPath[i].lat - geoPath[i - 1].lat),
          lng: geoPath[i - 1].lng + t * (geoPath[i].lng - geoPath[i - 1].lng),
        },
        km: nextThreshold,
      });
      nextThreshold += intervalKm;
    }

    accumulated += segDist;
  }

  return results;
}
