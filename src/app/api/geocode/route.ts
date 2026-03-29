import { NextResponse } from "next/server";

/**
 * Geocoding 프록시 — Nominatim (OpenStreetMap, 무료, 키 불필요)
 * GET /api/geocode?q=경기도+하남시+풍산동
 * 제한: 1 request/second (Nominatim 정책)
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "q 파라미터 필요" }, { status: 400 });
  }

  const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&countrycodes=kr&limit=5&accept-language=ko`;

  const res = await fetch(nominatimUrl, {
    headers: {
      "User-Agent": "ChungYakHouse/1.0 (housing-announcement-viewer)",
    },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "Geocoding 실패", status: res.status },
      { status: res.status }
    );
  }

  const data = await res.json();

  // Nominatim 응답을 간단한 형태로 변환
  const results = data.map((item: any) => ({
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    name: item.display_name,
    type: item.type,
  }));

  return NextResponse.json({ results });
}
