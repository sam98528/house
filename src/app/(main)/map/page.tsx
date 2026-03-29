import { createClient } from "@supabase/supabase-js";
import { MapView } from "@/components/map/map-view";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 지역명 → 좌표 매핑 (Nominatim 호출 줄이기 위한 캐시)
const REGION_COORDS: Record<string, [number, number]> = {
  서울특별시: [37.5665, 126.978],
  경기도: [37.275, 127.0095],
  인천광역시: [37.4563, 126.7052],
  부산광역시: [35.1796, 129.0756],
  대구광역시: [35.8714, 128.6014],
  "대구광역시 외": [35.8714, 128.6014],
  광주광역시: [35.1595, 126.8526],
  대전광역시: [36.3504, 127.3845],
  울산광역시: [35.5384, 129.3114],
  세종특별자치시: [36.48, 127.2589],
  강원특별자치도: [37.8228, 128.1555],
  충청북도: [36.6357, 127.4912],
  충청남도: [36.6588, 126.6728],
  전북특별자치도: [35.8203, 127.1088],
  전라남도: [34.8161, 126.4629],
  경상북도: [36.576, 128.5056],
  경상남도: [35.4606, 128.2132],
  제주특별자치도: [33.489, 126.4983],
};

export const revalidate = 3600;

export default async function MapPage() {
  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, pan_nm, cnp_cd_nm, pan_ss, upp_ais_tp_nm, ais_tp_cd_nm, pan_nt_st_dt, clsg_dt, dtl_url, dtl_url_mob")
    .in("pan_ss", ["공고중", "접수중", "정정공고중"])
    .order("pan_nt_st_dt", { ascending: false });

  const items = announcements ?? [];

  // 지역별로 그룹핑하여 핀 생성
  const regionGroups: Record<string, typeof items> = {};
  items.forEach((item) => {
    const region = item.cnp_cd_nm || "기타";
    if (!regionGroups[region]) regionGroups[region] = [];
    regionGroups[region].push(item);
  });

  const pins = Object.entries(regionGroups)
    .filter(([region]) => REGION_COORDS[region])
    .map(([region, items]) => {
      const [lat, lng] = REGION_COORDS[region];
      // 같은 지역 핀이 겹치지 않도록 약간의 오프셋
      return {
        lat: lat + (Math.random() - 0.5) * 0.02,
        lng: lng + (Math.random() - 0.5) * 0.02,
        title: `${region} (${items.length}건)`,
        info: items
          .slice(0, 5)
          .map((a) => `• ${a.pan_nm.substring(0, 30)}`)
          .join("<br/>") + (items.length > 5 ? `<br/>... 외 ${items.length - 5}건` : ""),
        count: items.length,
        region,
      };
    });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">지도로 보기</h1>
        <p className="text-gray-500 text-sm mt-1">
          {items.length}건의 진행중인 공고
        </p>
      </header>

      <MapView pins={pins} />

      {/* 지역별 요약 */}
      <div className="mt-4 space-y-2">
        {Object.entries(regionGroups)
          .sort((a, b) => b[1].length - a[1].length)
          .map(([region, items]) => (
            <div
              key={region}
              className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm"
            >
              <span className="font-medium">{region}</span>
              <span className="text-gray-500">{items.length}건</span>
            </div>
          ))}
      </div>
    </div>
  );
}
