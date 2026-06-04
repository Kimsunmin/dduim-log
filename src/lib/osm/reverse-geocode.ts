export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });
  const response = await fetch(`/api/geocode/reverse?${params.toString()}`);
  if (!response.ok) return "";
  const result = (await response.json()) as { label?: string };
  return result.label ?? "";
}
