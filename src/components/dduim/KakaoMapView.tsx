"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Course } from "@/lib/dduim/types";
import { COLOR_INK, COLOR_MID } from "@/lib/dduim/data";
import {
  loadKakaoMap,
  type KakaoCustomOverlay,
  type KakaoMap,
  type KakaoPolyline,
} from "@/lib/kakao/load-kakao-map";
import { MapView } from "./MapView";
import { ShoePins } from "./ShoePins";

type KakaoMapViewProps = {
  courses: Course[];
  activeId: string;
  onPick: (id: string) => void;
};

const DEFAULT_CENTER = { lat: 37.52693, lng: 126.93447 };

export function KakaoMapView({ courses, activeId, onPick }: KakaoMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const overlayRefs = useRef<KakaoCustomOverlay[]>([]);
  const polylineRef = useRef<KakaoPolyline | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

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
        const content = createCourseOverlayElement(course, isActive, () => onPick(course.id));
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
  }, [activeId, geoCourses, onPick, ready]);

  useEffect(() => {
    if (!ready || !mapRef.current) return;

    let alive = true;

    loadKakaoMap().then((maps) => {
      if (!alive || !mapRef.current) return;

      polylineRef.current?.setMap(null);
      polylineRef.current = null;

      if (!activeCourse?.geoPath?.length) return;

      const path = activeCourse.geoPath.map((point) => new maps.LatLng(point.lat, point.lng));
      polylineRef.current = new maps.Polyline({
        map: mapRef.current,
        path,
        strokeWeight: 6,
        strokeColor: COLOR_INK[activeCourse.color],
        strokeOpacity: 0.9,
        strokeStyle: "solid",
      });

      const start = activeCourse.startPoint ?? activeCourse.geoPath[0];
      mapRef.current.panTo(new maps.LatLng(start.lat, start.lng));
    });

    return () => {
      alive = false;
    };
  }, [activeCourse, ready]);

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
    </div>
  );
}

function createCourseOverlayElement(course: Course, isActive: boolean, onClick: () => void) {
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

  return button;
}
