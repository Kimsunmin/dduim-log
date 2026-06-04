import { NextResponse } from "next/server";

type NominatimResponse = {
  address?: Record<string, string | undefined>;
};

const DEFAULT_NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json({ error: "Valid lat and lng are required." }, { status: 400 });
  }

  const endpoint = process.env.NOMINATIM_REVERSE_URL || DEFAULT_NOMINATIM_REVERSE_URL;
  const params = new URLSearchParams({
    addressdetails: "1",
    "accept-language": "ko",
    format: "jsonv2",
    lat: String(lat),
    lon: String(lng),
    zoom: "13",
  });

  const response = await fetch(`${endpoint}?${params.toString()}`, {
    headers: { "User-Agent": process.env.OSM_USER_AGENT || "dduim-log/0.1" },
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!response.ok) return NextResponse.json({ label: "" }, { status: 200 });

  const data = (await response.json()) as NominatimResponse;
  const address = data.address ?? {};
  const city = address.city || address.town || address.county || address.state || "";
  const district = address.borough || address.city_district || address.suburb || "";
  const label = [city, district].filter(Boolean).join(" ");

  return NextResponse.json({ label });
}
