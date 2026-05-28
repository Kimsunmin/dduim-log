type KakaoLatLng = {
  getLat(): number;
  getLng(): number;
};

type KakaoSize = object;
type KakaoMarkerImage = object;

export type KakaoMouseEvent = {
  latLng: KakaoLatLng;
};

type KakaoMapsNamespace = {
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  Map: new (
    container: HTMLElement,
    options: { center: KakaoLatLng; level: number },
  ) => KakaoMap;
  Marker: new (options: {
    map?: KakaoMap | null;
    position: KakaoLatLng;
    draggable?: boolean;
    image?: KakaoMarkerImage;
    zIndex?: number;
  }) => KakaoMarker;
  MarkerImage: new (src: string, size: KakaoSize) => KakaoMarkerImage;
  Size: new (width: number, height: number) => KakaoSize;
  CustomOverlay: new (options: {
    clickable?: boolean;
    content: HTMLElement | string;
    map?: KakaoMap | null;
    position: KakaoLatLng;
    xAnchor?: number;
    yAnchor?: number;
    zIndex?: number;
  }) => KakaoCustomOverlay;
  Polyline: new (options: {
    map?: KakaoMap | null;
    path: KakaoLatLng[];
    strokeWeight?: number;
    strokeColor?: string;
    strokeOpacity?: number;
    strokeStyle?: string;
  }) => KakaoPolyline;
  event: {
    addListener(target: unknown, type: "click", handler: (e: KakaoMouseEvent) => void): void;
    addListener(target: unknown, type: string, handler: () => void): void;
  };
  load(callback: () => void): void;
};

export type KakaoMap = {
  panTo(position: KakaoLatLng): void;
  setCenter(position: KakaoLatLng): void;
  getCenter(): KakaoLatLng;
  setLevel(level: number): void;
  getLevel(): number;
  relayout(): void;
};

export type KakaoMarker = {
  setMap(map: KakaoMap | null): void;
  getPosition(): { getLat(): number; getLng(): number };
};

export type KakaoCustomOverlay = {
  setMap(map: KakaoMap | null): void;
  setPosition(position: KakaoLatLng): void;
  setZIndex(zIndex: number): void;
};

export type KakaoPolyline = {
  setMap(map: KakaoMap | null): void;
};

declare global {
  interface Window {
    kakao?: {
      maps: KakaoMapsNamespace;
    };
    __dduimKakaoMapPromise?: Promise<KakaoMapsNamespace>;
  }
}

const KAKAO_MAP_SDK_ID = "kakao-map-sdk";

export function loadKakaoMap() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Kakao Map can only load in the browser."));
  }

  if (window.kakao?.maps) {
    return new Promise<KakaoMapsNamespace>((resolve) => {
      window.kakao?.maps.load(() => resolve(window.kakao!.maps));
    });
  }

  if (window.__dduimKakaoMapPromise) {
    return window.__dduimKakaoMapPromise;
  }

  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY;

  if (!appKey) {
    return Promise.reject(new Error("Missing NEXT_PUBLIC_KAKAO_MAP_APP_KEY."));
  }

  window.__dduimKakaoMapPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(KAKAO_MAP_SDK_ID) as HTMLScriptElement | null;
    const timeout = window.setTimeout(() => {
      reject(new Error("Timed out loading Kakao Map SDK."));
    }, 7000);

    const handleLoad = () => {
      window.clearTimeout(timeout);
      if (!window.kakao?.maps) {
        reject(new Error("Kakao Map SDK loaded without window.kakao.maps."));
        return;
      }
      window.kakao.maps.load(() => resolve(window.kakao!.maps));
    };

    if (existing) {
      existing.addEventListener("load", handleLoad, { once: true });
      existing.addEventListener(
        "error",
        () => {
          window.clearTimeout(timeout);
          reject(new Error("Failed to load Kakao Map SDK."));
        },
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = KAKAO_MAP_SDK_ID;
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&libraries=services&autoload=false`;
    script.onload = handleLoad;
    script.onerror = () => {
      window.clearTimeout(timeout);
      reject(new Error("Failed to load Kakao Map SDK."));
    };
    document.head.appendChild(script);
  });

  return window.__dduimKakaoMapPromise;
}
