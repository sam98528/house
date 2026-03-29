import { createClient } from "@supabase/supabase-js";
import { MapPageClient } from "@/components/map/map-page-client";
import type { MapPin } from "@/components/map/kakao-map";
import { formatDate, formatWon } from "@/lib/api/myhome-v2";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const revalidate = 3600;

// 좌표 없을 때 지역 중심 좌표로 대체
const REGION_FALLBACK: Record<string, { lat: number; lng: number }> = {
  서울특별시: { lat: 37.5665, lng: 126.978 },
  부산광역시: { lat: 35.1796, lng: 129.0756 },
  대구광역시: { lat: 35.8714, lng: 128.6014 },
  인천광역시: { lat: 37.4563, lng: 126.7052 },
  광주광역시: { lat: 35.1595, lng: 126.8526 },
  대전광역시: { lat: 36.3504, lng: 127.3845 },
  울산광역시: { lat: 35.5384, lng: 129.3114 },
  세종특별자치시: { lat: 36.48, lng: 127.2589 },
  경기도: { lat: 37.275, lng: 127.0095 },
  강원특별자치도: { lat: 37.8228, lng: 128.1555 },
  충청북도: { lat: 36.6357, lng: 127.4912 },
  충청남도: { lat: 36.6588, lng: 126.6728 },
  전북특별자치도: { lat: 35.8203, lng: 127.1088 },
  전라남도: { lat: 34.8161, lng: 126.4629 },
  경상북도: { lat: 36.576, lng: 128.5056 },
  경상남도: { lat: 35.4606, lng: 128.2132 },
  제주특별자치도: { lat: 33.489, lng: 126.4983 },
};

function getRecruitStatus(beginDe: string, endDe: string): "접수중" | "접수예정" {
  // 한국 시간 기준
  const kr = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const today = kr.toISOString().slice(0, 10).replace(/-/g, "");
  if (!beginDe || !endDe) return "접수중";
  if (today < beginDe) return "접수예정";
  return "접수중";
}

export default async function HomePage() {
  const { data: announcements } = await supabase
    .from("announcements")
    .select("*")
    .order("rcrit_pblanc_de", { ascending: false });

  const items = announcements ?? [];

  const pins: MapPin[] = items.map((item) => {
    const recruitStatus = getRecruitStatus(item.begin_de, item.end_de);
    const isSale = item.source === "sale";
    const subType = isSale ? "공공분양" : (item.suply_ty_nm || "공공임대");

    // 좌표: DB에 있으면 사용, 없으면 지역 중심 좌표
    const hasExactCoords = item.lat != null && item.lng != null;
    const fallback = REGION_FALLBACK[item.brtc_nm];
    const lat = hasExactCoords ? item.lat : fallback?.lat ?? 36.5;
    const lng = hasExactCoords ? item.lng : fallback?.lng ?? 127.5;

    return {
      id: item.id,
      lat,
      lng,
      title: item.pblanc_nm,
      status: item.sttus_nm,
      recruitStatus,
      type: isSale ? "공공분양" : "공공임대",
      subType,
      region: [item.brtc_nm, item.signgu_nm].filter(Boolean).join(" ") || "전국",
      brtcNm: item.brtc_nm || "전국",
      address: item.full_adres?.trim() || null,
      complexName: item.hsmp_nm || null,
      date: `${formatDate(item.begin_de)} ~ ${formatDate(item.end_de)}`,
      url: item.mobile_url || item.pc_url || item.detail_url || undefined,
      extra:
        item.rent_gtn > 0
          ? `보증금 ${formatWon(item.rent_gtn)} / 월 ${formatWon(item.mt_rntchrg)}`
          : item.sum_suply_co
            ? `${item.sum_suply_co}호 공급`
            : undefined,
      supplyCount: item.sum_suply_co || undefined,
      rentDeposit: item.rent_gtn > 0 ? formatWon(item.rent_gtn) : undefined,
      monthlyRent: item.mt_rntchrg > 0 ? formatWon(item.mt_rntchrg) : undefined,
      supplyOrg: item.suply_instt_nm || undefined,
      houseType: item.house_ty_nm || undefined,
      announceDe: item.rcrit_pblanc_de ? formatDate(item.rcrit_pblanc_de) : undefined,
      winnerDe: item.przwner_presnatn_de ? formatDate(item.przwner_presnatn_de) : undefined,
      heatMethod: item.heat_mthd_nm || undefined,
      hasCoords: hasExactCoords,
    };
  });

  return <MapPageClient pins={pins} />;
}
