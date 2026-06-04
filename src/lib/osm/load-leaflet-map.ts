type LeafletLatLng = {
  lat: number;
  lng: number;
};

type LeafletBounds = {
  extend(position: [number, number] | LeafletLatLng): LeafletBounds;
  isValid(): boolean;
};

type LeafletMapOptions = {
  center: [number, number];
  minZoom?: number;
  zoom: number;
  zoomControl?: boolean;
};

type LeafletTileLayerOptions = {
  attribution?: string;
  maxNativeZoom?: number;
  maxZoom?: number;
  minZoom?: number;
};

type LeafletMarkerOptions = {
  draggable?: boolean;
  icon?: LeafletDivIcon | LeafletIcon;
  zIndexOffset?: number;
};

type LeafletPolylineOptions = {
  color?: string;
  dashArray?: string;
  opacity?: number;
  weight?: number;
};

type LeafletDivIconOptions = {
  className?: string;
  html?: HTMLElement | string;
  iconAnchor?: [number, number];
  iconSize?: [number, number];
};

type LeafletIconOptions = {
  iconAnchor?: [number, number];
  iconSize?: [number, number];
  iconUrl: string;
};

type LeafletEventMap = {
  click: { latlng: LeafletLatLng; originalEvent?: MouseEvent };
  dragstart: unknown;
  dragend: unknown;
  moveend: unknown;
};

type LeafletEventName = keyof LeafletEventMap;

type LeafletEvented = {
  on<T extends LeafletEventName>(type: T, handler: (event: LeafletEventMap[T]) => void): LeafletEvented;
  off<T extends LeafletEventName>(type: T, handler: (event: LeafletEventMap[T]) => void): LeafletEvented;
};

export type LeafletMap = LeafletEvented & {
  fitBounds(bounds: LeafletBounds, options?: { padding?: [number, number]; maxZoom?: number }): void;
  getCenter(): LeafletLatLng;
  getZoom(): number;
  panTo(position: [number, number] | LeafletLatLng): void;
  remove(): void;
  setView(position: [number, number] | LeafletLatLng, zoom?: number): void;
};

export type LeafletMarker = LeafletEvented & {
  addTo(map: LeafletMap): LeafletMarker;
  getLatLng(): LeafletLatLng;
  remove(): void;
  setLatLng(position: [number, number] | LeafletLatLng): void;
};

export type LeafletPolyline = {
  addTo(map: LeafletMap): LeafletPolyline;
  remove(): void;
};

export type LeafletNamespace = {
  divIcon(options: LeafletDivIconOptions): LeafletDivIcon;
  icon(options: LeafletIconOptions): LeafletIcon;
  latLngBounds(points?: Array<[number, number] | LeafletLatLng>): LeafletBounds;
  map(container: HTMLElement, options: LeafletMapOptions): LeafletMap;
  marker(position: [number, number] | LeafletLatLng, options?: LeafletMarkerOptions): LeafletMarker;
  polyline(points: Array<[number, number] | LeafletLatLng>, options?: LeafletPolylineOptions): LeafletPolyline;
  tileLayer(url: string, options?: LeafletTileLayerOptions): { addTo(map: LeafletMap): void };
};

type LeafletDivIcon = object;
type LeafletIcon = object;

declare global {
  interface Window {
    L?: LeafletNamespace;
    __dduimLeafletPromise?: Promise<LeafletNamespace>;
  }
}

const LEAFLET_CSS_ID = "leaflet-css";
const LEAFLET_SCRIPT_ID = "leaflet-js";
const LEAFLET_VERSION = "1.9.4";

export function loadLeafletMap() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Leaflet can only load in the browser."));
  }

  if (window.L) return Promise.resolve(window.L);
  if (window.__dduimLeafletPromise) return window.__dduimLeafletPromise;

  ensureLeafletCss();

  window.__dduimLeafletPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(LEAFLET_SCRIPT_ID) as HTMLScriptElement | null;

    const timeout = window.setTimeout(() => {
      reject(new Error("Timed out loading Leaflet."));
    }, 12000);

    const finish = () => {
      window.clearTimeout(timeout);
      if (window.L) resolve(window.L);
      else reject(new Error("Leaflet loaded without window.L."));
    };

    if (existing) {
      existing.addEventListener("load", finish, { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Leaflet.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = LEAFLET_SCRIPT_ID;
    script.async = true;
    script.src = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;
    script.addEventListener("load", finish, { once: true });
    script.addEventListener("error", () => {
      window.clearTimeout(timeout);
      reject(new Error("Failed to load Leaflet."));
    }, { once: true });
    document.head.appendChild(script);
  });

  return window.__dduimLeafletPromise;
}

function ensureLeafletCss() {
  if (document.getElementById(LEAFLET_CSS_ID)) return;
  const link = document.createElement("link");
  link.id = LEAFLET_CSS_ID;
  link.rel = "stylesheet";
  link.href = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
  document.head.appendChild(link);
}
