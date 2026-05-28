type KakaoAddressResult = {
  address: {
    region_1depth_name: string; // 서울특별시, 경기도, …
    region_2depth_name: string; // 마포구, 강남구, …
  };
};

function getGeocoder(): { coord2Address(lng: number, lat: number, cb: (r: KakaoAddressResult[], status: string) => void): void } | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const services = (window.kakao?.maps as any)?.services;
  if (!services?.Geocoder) return null;
  return new services.Geocoder() as ReturnType<typeof getGeocoder>;
}

/** lat/lng 좌표로 "서울 마포구" 형식의 약식 주소를 반환. 실패 시 빈 문자열. */
export function reverseGeocode(lat: number, lng: number): Promise<string> {
  return new Promise((resolve) => {
    const geocoder = getGeocoder();
    if (!geocoder) { resolve(""); return; }

    geocoder.coord2Address(lng, lat, (result, status) => {
      if (status !== "OK" || !result?.[0]) { resolve(""); return; }

      const addr = result[0].address;
      const r1 = (addr.region_1depth_name ?? "")
        .replace(/(특별자치도|특별자치시|특별시|광역시|도)$/, "")
        .trim();
      const r2 = addr.region_2depth_name ?? "";
      resolve(r2 ? `${r1} ${r2}` : r1);
    });
  });
}
