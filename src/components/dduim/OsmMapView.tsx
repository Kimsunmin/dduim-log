"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Course, LatLngLiteral } from "@/lib/dduim/types";
import { COLOR_INK, COLOR_MID } from "@/lib/dduim/data";
import { getKmMarkerPoints } from "@/lib/dduim/utils";
import {
  loadLeafletMap,
  type LeafletMap,
  type LeafletMarker,
  type LeafletNamespace,
  type LeafletPolyline,
} from "@/lib/osm/load-leaflet-map";
import {
  OSM_BASEMAP_ATTRIBUTION,
  OSM_BASEMAP_MAX_NATIVE_ZOOM,
  OSM_BASEMAP_MAX_ZOOM,
  OSM_BASEMAP_MIN_ZOOM,
  OSM_BASEMAP_TILE_URL,
} from "@/lib/osm/basemap";
import { MapView } from "./MapView";
import { ShoePins } from "./ShoePins";

type OsmMapViewProps = {
  courses: Course[];
  activeId: string;
  favoriteIds?: Set<string>;
  onPick: (id: string) => void;
  panToLatLng?: { lat: number; lng: number; level?: number };
  onCenterChange?: (center: { lat: number; lng: number; level: number }) => void;
};

const DEFAULT_CENTER = { lat: 37.52693, lng: 126.93447, zoom: 12 };

export function OsmMapView({ courses, activeId, favoriteIds, onPick, panToLatLng, onCenterChange }: OsmMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRefs = useRef<LeafletMarker[]>([]);
  const polylineRef = useRef<LeafletPolyline | null>(null);
  const kmMarkersRef = useRef<LeafletMarker[]>([]);
  const locationMarkerRef = useRef<LeafletMarker | null>(null);
  const onCenterChangeRef = useRef(onCenterChange);
  const [leaflet, setLeaflet] = useState<LeafletNamespace | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [geoState, setGeoState] = useState<"idle" | "locating" | "denied">("idle");

  const geoCourses = useMemo(
    () => courses.filter((course) => course.startPoint && course.geoPath?.length),
    [courses],
  );
  const activeCourse = geoCourses.find((course) => course.id === activeId);

  useEffect(() => {
    onCenterChangeRef.current = onCenterChange;
  }, [onCenterChange]);

  useEffect(() => {
    let cancelled = false;

    loadLeafletMap()
      .then((L) => {
        if (cancelled || !containerRef.current) return;

        const map = L.map(containerRef.current, {
          center: [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng],
          minZoom: OSM_BASEMAP_MIN_ZOOM,
          zoom: DEFAULT_CENTER.zoom,
          zoomControl: false,
        });

        L.tileLayer(OSM_BASEMAP_TILE_URL, {
          attribution: OSM_BASEMAP_ATTRIBUTION,
          maxNativeZoom: OSM_BASEMAP_MAX_NATIVE_ZOOM,
          maxZoom: OSM_BASEMAP_MAX_ZOOM,
          minZoom: OSM_BASEMAP_MIN_ZOOM,
        }).addTo(map);

        const handleMoveEnd = () => {
          const center = map.getCenter();
          onCenterChangeRef.current?.({ lat: center.lat, lng: center.lng, level: map.getZoom() });
        };

        map.on("moveend", handleMoveEnd);
        mapRef.current = map;
        setLeaflet(L);
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setReady(false);
          setFailed(true);
        }
      });

    return () => {
      cancelled = true;
      markerRefs.current.forEach((marker) => marker.remove());
      markerRefs.current = [];
      polylineRef.current?.remove();
      polylineRef.current = null;
      kmMarkersRef.current.forEach((marker) => marker.remove());
      kmMarkersRef.current = [];
      locationMarkerRef.current?.remove();
      locationMarkerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!ready || !leaflet || !mapRef.current) return;

    markerRefs.current.forEach((marker) => marker.remove());
    markerRefs.current = geoCourses.map((course) => {
      const isActive = course.id === activeId;
      const isFav = favoriteIds?.has(course.id) ?? false;
      const marker = leaflet
        .marker(toTuple(course.startPoint!), {
          icon: leaflet.divIcon({
            className: "osm-course-marker",
            html: createCourseOverlayElement(course, isActive, isFav),
            iconAnchor: [23, 15],
            iconSize: [46, 30],
          }),
          zIndexOffset: isActive ? 300 : 200,
        })
        .addTo(mapRef.current!);

      marker.on("click", () => onPick(course.id));
      return marker;
    });
  }, [activeId, favoriteIds, geoCourses, leaflet, onPick, ready]);

  useEffect(() => {
    if (!ready || !leaflet || !mapRef.current) return;

    polylineRef.current?.remove();
    polylineRef.current = null;
    kmMarkersRef.current.forEach((marker) => marker.remove());
    kmMarkersRef.current = [];

    if (!activeCourse?.geoPath?.length) return;

    const routeColor = COLOR_INK[activeCourse.color];
    const routePoints = activeCourse.geoPath.map(toTuple);
    polylineRef.current = leaflet.polyline(routePoints, {
      color: routeColor,
      opacity: 0.9,
      weight: 6,
    }).addTo(mapRef.current);

    kmMarkersRef.current = getKmMarkerPoints(activeCourse.geoPath, 1).map(({ point, km }) =>
      leaflet.marker(toTuple(point), {
        icon: leaflet.divIcon({
          className: "osm-km-marker",
          html: createKmMarkerElement(km, routeColor),
          iconAnchor: [15, 12],
          iconSize: [30, 24],
        }),
        zIndexOffset: 250,
      }).addTo(mapRef.current!),
    );

    if (routePoints.length > 1) {
      mapRef.current.fitBounds(leaflet.latLngBounds(routePoints), { padding: [36, 36], maxZoom: 16 });
    } else {
      mapRef.current.panTo(routePoints[0]);
    }
  }, [activeCourse, leaflet, ready]);

  useEffect(() => {
    if (!ready || !mapRef.current || !panToLatLng) return;
    mapRef.current.setView(
      [panToLatLng.lat, panToLatLng.lng],
      toLeafletZoom(panToLatLng.level ?? mapRef.current.getZoom()),
    );
  }, [panToLatLng, ready]);

  const handleMyLocation = () => {
    if (!navigator.geolocation || !mapRef.current || !leaflet) return;
    setGeoState("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        locationMarkerRef.current?.remove();
        locationMarkerRef.current = leaflet.marker([lat, lng], {
          icon: leaflet.divIcon({
            className: "osm-location-marker",
            html: createMyLocationElement(),
            iconAnchor: [10, 10],
            iconSize: [20, 20],
          }),
          zIndexOffset: 500,
        }).addTo(mapRef.current!);
        mapRef.current?.setView([lat, lng], 15);
        setGeoState("idle");
      },
      (err) => {
        setGeoState(err.code === err.PERMISSION_DENIED ? "denied" : "idle");
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  if (failed) {
    return (
      <>
        <MapView courses={courses} activeId={activeId} />
        <ShoePins courses={courses} activeId={activeId} onPick={onPick} />
      </>
    );
  }

  return (
    <div className="osm-map-shell">
      <div ref={containerRef} className="osm-map" />
      {!ready && (
        <div className="map-loading">
          <span>지도 불러오는 중</span>
        </div>
      )}
      {ready && (
        <button
          onClick={handleMyLocation}
          disabled={geoState === "locating"}
          title={geoState === "denied" ? "위치 권한을 허용해 주세요" : "내 위치"}
          aria-label="내 위치"
          className="osm-location-button"
        >
          {geoState === "locating" ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              style={{ animation: "spin 1s linear infinite" }}>
              <path d="M12 2a10 10 0 0 1 10 10"/>
            </svg>
          ) : geoState === "denied" ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
              <line x1="3" y1="3" x2="21" y2="21"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
            </svg>
          )}
        </button>
      )}
    </div>
  );
}

function createKmMarkerElement(km: number, color: string): HTMLElement {
  const el = document.createElement("div");
  el.style.cssText = [
    "background:white",
    `border:2px solid ${color}`,
    "border-radius:10px",
    "padding:1px 6px",
    "font-size:10px",
    "font-weight:700",
    `color:${color}`,
    "box-shadow:0 1px 4px rgba(0,0,0,.18)",
    "pointer-events:none",
    "line-height:1.6",
    "white-space:nowrap",
  ].join(";");
  el.textContent = `${km}km`;
  return el;
}

function createCourseOverlayElement(course: Course, isActive: boolean, isFav: boolean) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `kakao-course-pin ${isActive ? "is-active" : ""}`;
  button.style.background = isActive ? "var(--yellow)" : COLOR_MID[course.color];
  button.setAttribute("aria-label", `${course.title} 선택`);

  const distance = document.createElement("span");
  distance.textContent = course.distance.toFixed(1);
  button.appendChild(distance);

  const unit = document.createElement("small");
  unit.textContent = "km";
  button.appendChild(unit);

  if (course.mine) {
    const mine = document.createElement("i");
    mine.textContent = "나";
    button.appendChild(mine);
  }

  if (isFav) {
    const heart = document.createElement("span");
    heart.textContent = "♥";
    heart.style.cssText = [
      "position:absolute",
      "top:-8px",
      "right:-6px",
      "font-size:11px",
      "line-height:1",
      "background:white",
      "border-radius:999px",
      "width:16px",
      "height:16px",
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "box-shadow:0 1px 3px rgba(0,0,0,.18)",
      "color:#FF9BA6",
    ].join(";");
    button.style.position = "relative";
    button.appendChild(heart);
  }

  return button;
}

function createMyLocationElement(): HTMLElement {
  const outer = document.createElement("div");
  outer.style.cssText = "position:relative;width:20px;height:20px;";

  const ring = document.createElement("div");
  ring.style.cssText = "position:absolute;inset:-8px;border-radius:50%;background:rgba(66,133,244,0.18);pointer-events:none;";

  const dot = document.createElement("div");
  dot.style.cssText = "width:20px;height:20px;border-radius:50%;background:#4285F4;border:3px solid white;box-shadow:0 1px 6px rgba(0,0,0,0.3);";

  outer.appendChild(ring);
  outer.appendChild(dot);
  return outer;
}

function toTuple(point: LatLngLiteral): [number, number] {
  return [point.lat, point.lng];
}

function toLeafletZoom(level: number) {
  const zoom = level > 10 ? level : 16 - level;
  return Math.max(OSM_BASEMAP_MIN_ZOOM, Math.min(OSM_BASEMAP_MAX_ZOOM, zoom));
}
