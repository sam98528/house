import { createClient } from "@supabase/supabase-js";
import { MapPageClient } from "@/components/map/map-page-client";
import type { MapPin } from "@/components/map/kakao-map";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const REGION_COORDS: Record<string, { lat: number; lng: number }> = {
  서울특별시: { lat: 37.5665, lng: 126.978 },
  경기도: { lat: 37.275, lng: 127.0095 },
  인천광역시: { lat: 37.4563, lng: 126.7052 },
  부산광역시: { lat: 35.1796, lng: 129.0756 },
  대구광역시: { lat: 35.8714, lng: 128.6014 },
  "대구광역시 외": { lat: 35.9, lng: 128.65 },
  광주광역시: { lat: 35.1595, lng: 126.8526 },
  대전광역시: { lat: 36.3504, lng: 127.3845 },
  울산광역시: { lat: 35.5384, lng: 129.3114 },
  세종특별자치시: { lat: 36.48, lng: 127.2589 },
  "강원특별자치도": { lat: 37.8228, lng: 128.1555 },
  충청북도: { lat: 36.6357, lng: 127.4912 },
  충청남도: { lat: 36.6588, lng: 126.6728 },
  "전북특별자치도": { lat: 35.8203, lng: 127.1088 },
  전라남도: { lat: 34.8161, lng: 126.4629 },
  경상북도: { lat: 36.576, lng: 128.5056 },
  경상남도: { lat: 35.4606, lng: 128.2132 },
  제주특별자치도: { lat: 33.489, lng: 126.4983 },
};

export const revalidate = 3600;

export default async function MapPage() {
  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, pan_nm, cnp_cd_nm, pan_ss, upp_ais_tp_nm, ais_tp_cd_nm, pan_nt_st_dt, clsg_dt, dtl_url, dtl_url_mob")
    .order("pan_nt_st_dt", { ascending: false });

  const items = announcements ?? [];
  const regionCount: Record<string, number> = {};

  const pins: MapPin[] = items
    .filter((item) => REGION_COORDS[item.cnp_cd_nm])
    .map((item) => {
      const region = item.cnp_cd_nm;
      const base = REGION_COORDS[region];
      const idx = regionCount[region] || 0;
      regionCount[region] = idx + 1;

      const angle = idx * 0.8;
      const radius = 0.008 + idx * 0.002;

      return {
        id: item.id,
        lat: base.lat + Math.cos(angle) * radius,
        lng: base.lng + Math.sin(angle) * radius,
        title: item.pan_nm,
        status: item.pan_ss,
        type: item.upp_ais_tp_nm,
        subType: item.ais_tp_cd_nm,
        region: item.cnp_cd_nm,
        date: `${item.pan_nt_st_dt} ~ ${item.clsg_dt}`,
        url: item.dtl_url_mob || item.dtl_url || undefined,
      };
    });

  return <MapPageClient pins={pins} />;
}
