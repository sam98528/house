import { createClient } from "@supabase/supabase-js";
import { MapPageClient } from "@/components/map/map-page-client";
import type { MapPin } from "@/components/map/kakao-map";
import { formatDate, formatWon } from "@/lib/api/myhome-v2";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const revalidate = 3600;

export default async function HomePage() {
  const { data: announcements } = await supabase
    .from("announcements")
    .select("*")
    .not("lat", "is", null)
    .not("lng", "is", null)
    .order("rcrit_pblanc_de", { ascending: false });

  const items = announcements ?? [];

  const pins: MapPin[] = items.map((item) => ({
    id: item.id,
    lat: item.lat,
    lng: item.lng,
    title: item.pblanc_nm,
    status: item.sttus_nm,
    type: item.source === "sale" ? "공공분양" : "공공임대",
    subType: item.suply_ty_nm || item.house_ty_nm,
    region: `${item.brtc_nm} ${item.signgu_nm}`,
    address: item.full_adres || `${item.brtc_nm} ${item.signgu_nm}`,
    complexName: item.hsmp_nm,
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
  }));

  return <MapPageClient pins={pins} />;
}
