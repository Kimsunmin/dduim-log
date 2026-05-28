"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Course } from "@/lib/dduim/types";
import { COLOR_INK, COLOR_MID } from "@/lib/dduim/data";
import {
  loadKakaoMap,
  type KakaoCustomOverlay,
  type KakaoMap,
  type KakaoPolyline,
} from "@/lib/kakao/load-kakao-map";import { getKmMarkerPoints } from "@/lib/dduim/utils";import { MapView } from "./MapView";
import { ShoePins } from "./ShoePins";

type KakaoMapViewProps = {
  courses: Course[];
  activeId: string;
  favoriteIds?: Set<string>;
  onPick: (id: string) => void;
  panToLatLng?: { lat: number; lng: number; level?: number };
  onCenterChange?: (center: { lat: number; lng: number; level: number }) => void;
};

const DEFAULT_CENTER = { lat: 37.52693, lng: 126.93447 };

export function KakaoMapView({ courses, activeId, favoriteIds, onPick, panToLatLng, onCenterChange }: KakaoMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const overlayRefs = useRef<KakaoCustomOverlay[]>([]);
  const polylineRef = useRef<KakaoPolyline | null>(null);
  const kmMarkersRef = useRef<KakaoCustomOverlay[]>([]);
  const locationOverlayRef = useRef<KakaoCustomOverlay | null>(null);
  const onCenterChangeRef = useRef(onCenterChange);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [geoState, setGeoState] = useState<"idle" | "locating" | "denied">("idle");

  const handleMyLocation = () => {
    if (!navigator.geolocation || !mapRef.current) return;
    setGeoState("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        loadKakaoMap().then((maps) => {
          if (!mapRef.current) return;
          locationOverlayRef.current?.setMap(null);
          locationOverlayRef.current = new maps.CustomOverlay({
            content: createMyLocationElement(),
            map: mapRef.current,
            position: new maps.LatLng(lat, lng),
            xAnchor: 0.5,
            yAnchor: 0.5,
            zIndex: 50,
          });
          mapRef.current.setLevel(4);
          mapRef.current.panTo(new maps.LatLng(lat, lng));
          setGeoState("idle");
        });
      },
      (err) => {
        setGeoState(err.code === err.PERMISSION_DENIED ? "denied" : "idle");
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const geoCourses = useMemo(
    () => courses.filter((course) => course.startPoint && course.geoPath?.length),
    [courses],
  );
  const activeCourse = geoCourses.find((course) => course.id === activeId);

  useEffect(() => {
    let cancelled = false;

    loadKakaoMap()
      .then((maps) => {
        if (cancelled || !containerRef.current) return;

        const map = new maps.Map(containerRef.current, {
          center: new maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
          level: 7,
        });

        mapRef.current = map;
        if (onCenterChangeRef.current) {
          maps.event.addListener(map, "idle", () => {
            const c = map.getCenter();
            onCenterChangeRef.current?.({ lat: c.getLat(), lng: c.getLng(), level: map.getLevel() });
          });
        }
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
      overlayRefs.current.forEach((overlay) => overlay.setMap(null));
      overlayRefs.current = [];
      polylineRef.current?.setMap(null);
      polylineRef.current = null;
      kmMarkersRef.current.forEach((m) => m.setMap(null));
      kmMarkersRef.current = [];
      locationOverlayRef.current?.setMap(null);
      locationOverlayRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current) return;

    let alive = true;

    loadKakaoMap().then((maps) => {
      if (!alive || !mapRef.current) return;

      overlayRefs.current.forEach((overlay) => overlay.setMap(null));
      overlayRefs.current = geoCourses.map((course) => {
        const isActive = course.id === activeId;
        const isFav = favoriteIds?.has(course.id) ?? false;
        const content = createCourseOverlayElement(course, isActive, isFav, () => onPick(course.id));
        const overlay = new maps.CustomOverlay({
          clickable: true,
          content,
          map: mapRef.current!,
          position: new maps.LatLng(course.startPoint!.lat, course.startPoint!.lng),
          xAnchor: 0.5,
          yAnchor: 0.5,
          zIndex: isActive ? 30 : 20,
        });
        return overlay;
      });
    });

    return () => {
      alive = false;
    };
  }, [activeId, favoriteIds, geoCourses, onPick, ready]);

  useEffect(() => {
    if (!ready || !mapRef.current) return;

    let alive = true;

    loadKakaoMap().then((maps) => {
      if (!alive || !mapRef.current) return;

      polylineRef.current?.setMap(null);
      polylineRef.current = null;
      kmMarkersRef.current.forEach((m) => m.setMap(null));
      kmMarkersRef.current = [];

      if (!activeCourse?.geoPath?.length) return;

      const path = activeCourse.geoPath.map((point) => new maps.LatLng(point.lat, point.lng));
      const routeColor = COLOR_INK[activeCourse.color];
      polylineRef.current = new maps.Polyline({
        map: mapRef.current,
        path,
        strokeWeight: 6,
        strokeColor: routeColor,
        strokeOpacity: 0.9,
        strokeStyle: "solid",
      });

      // km 구간 마커
      const kmPoints = getKmMarkerPoints(activeCourse.geoPath, 1);
      kmMarkersRef.current = kmPoints.map(({ point, km }) =>
        new maps.CustomOverlay({
          clickable: false,
          content: createKmMarkerElement(km, routeColor),
          map: mapRef.current!,
          position: new maps.LatLng(point.lat, point.lng),
          xAnchor: 0.5,
          yAnchor: 0.5,
          zIndex: 25,
        })
      );

      const start = activeCourse.startPoint ?? activeCourse.geoPath[0];
      mapRef.current.panTo(new maps.LatLng(start.lat, start.lng));
    });

    return () => {
      alive = false;
    };
  }, [activeCourse, ready]);

  useEffect(() => {
    if (!ready || !mapRef.current || !panToLatLng) return;
    loadKakaoMap().then((maps) => {
      if (!mapRef.current) return;
      if (panToLatLng.level != null) mapRef.current.setLevel(panToLatLng.level);
      mapRef.current.panTo(new maps.LatLng(panToLatLng.lat, panToLatLng.lng));
    });
  }, [panToLatLng, ready]);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const timeout = window.setTimeout(() => mapRef.current?.relayout(), 100);
    return () => window.clearTimeout(timeout);
  }, [ready]);

  if (failed) {
    return (
      <>
        <MapView courses={courses} activeId={activeId} />
        <ShoePins courses={courses} activeId={activeId} onPick={onPick} />
      </>
    );
  }

  return (
    <div className="kakao-map-shell">
      <div ref={containerRef} className="kakao-map" />
      {!ready && (
        <div className="map-loading">
          <span>지도를 불러오는 중</span>
        </div>
      )}
      {ready && (
        <button
          onClick={handleMyLocation}
          disabled={geoState === "locating"}
          title={geoState === "denied" ? "위치 권한이 없어요. 브라우저 설정에서 허용해 주세요." : "내 위치"}
          aria-label="내 위치"
          style={{
            position: "absolute", bottom: 164, right: 28,
            width: 40, height: 40, borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.08)",
            background: "white",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: geoState === "locating" ? "wait" : "pointer",
            color: geoState === "denied" ? "#bbb" : "#4285F4",
            zIndex: 10, flexShrink: 0,
          }}
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

function createCourseOverlayElement(course: Course, isActive: boolean, isFav: boolean, onClick: () => void) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `kakao-course-pin ${isActive ? "is-active" : ""}`;
  button.style.background = isActive ? "var(--yellow)" : COLOR_MID[course.color];
  button.setAttribute("aria-label", `${course.title} 선택`);
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    onClick();
  });

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
