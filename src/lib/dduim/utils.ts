import type { LatLngLiteral } from "./types";

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
