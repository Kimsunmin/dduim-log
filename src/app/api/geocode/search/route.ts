import { NextResponse } from "next/server";

type NominatimSearchItem = {
  address?: Record<string, string | undefined>;
  boundingbox?: string[];
  class?: string;
  display_name?: string;
  lat?: string;
  lon?: string;
  name?: string;
  osm_id?: number | string;
  place_id?: number | string;
  type?: string;
};

const DEFAULT_NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim();

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  if (query.length > 80) {
    return NextResponse.json({ error: "Search query is too long." }, { status: 400 });
  }

  const endpoint = process.env.NOMINATIM_SEARCH_URL || DEFAULT_NOMINATIM_SEARCH_URL;
  const params = new URLSearchParams({
    addressdetails: "1",
    "accept-language": "ko",
    countrycodes: "kr",
    format: "jsonv2",
    limit: "6",
    q: query,
  });

  const response = await fetch(`${endpoint}?${params.toString()}`, {
    headers: { "User-Agent": process.env.OSM_USER_AGENT || "dduim-log/0.1" },
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!response.ok) {
    return NextResponse.json({ results: [] }, { status: 200 });
  }

  const data = (await response.json()) as NominatimSearchItem[];
  const results = data
    .map((item, index) => normalizePlace(item, index))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return NextResponse.json({ results });
}

function normalizePlace(item: NominatimSearchItem, index: number) {
  const lat = Number(item.lat);
  const lng = Number(item.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const address = item.address ?? {};
  const displayParts = (item.display_name ?? "").split(",").map((part) => part.trim()).filter(Boolean);
  const name = item.name || address.railway || address.station || address.amenity || displayParts[0] || "검색 결과";
  const areaParts = [
    address.city || address.town || address.county || address.state,
    address.borough || address.city_district || address.suburb,
    address.neighbourhood || address.quarter || address.road,
  ].filter((part): part is string => Boolean(part && part !== name));
  const label = areaParts.length ? areaParts.join(" ") : displayParts.slice(1, 4).join(" ");

  return {
    id: String(item.place_id ?? item.osm_id ?? `${lat}:${lng}:${index}`),
    label,
    lat,
    lng,
    name,
    type: item.type || item.class || "",
  };
}
