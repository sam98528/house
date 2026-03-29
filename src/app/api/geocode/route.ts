import { NextResponse } from "next/server";

/**
 * 카카오 Geocoding 프록시
 * 카카오 REST API는 CORS 미지원 → 서버사이드 프록시
 * GET /api/geocode?q=청주시+오송읍
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "q 파라미터 필요" }, { status: 400 });
  }

  const headers = {
    Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}`,
  };

  // 1차: keyword 검색 (단지명, 장소명)
  const kwRes = await fetch(
    `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&size=5`,
    { headers }
  );

  if (kwRes.ok) {
    const kwData = await kwRes.json();
    if (kwData.documents?.length > 0) {
      return NextResponse.json({
        results: kwData.documents.map((d: any) => ({
          lat: parseFloat(d.y),
          lng: parseFloat(d.x),
          name: d.place_name,
          address: d.road_address_name || d.address_name,
          category: d.category_group_name,
        })),
      });
    }
  }

  // 2차: address 검색 (주소)
  const addrRes = await fetch(
    `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(query)}&size=5`,
    { headers }
  );

  if (addrRes.ok) {
    const addrData = await addrRes.json();
    if (addrData.documents?.length > 0) {
      return NextResponse.json({
        results: addrData.documents.map((d: any) => ({
          lat: parseFloat(d.y),
          lng: parseFloat(d.x),
          name: d.address_name,
          address: d.road_address?.address_name || d.address_name,
        })),
      });
    }
  }

  return NextResponse.json({ results: [] });
}
