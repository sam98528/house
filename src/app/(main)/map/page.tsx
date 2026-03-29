import { createClient } from "@supabase/supabase-js";
import { MapPageClient } from "@/components/map/map-page-client";
import type { MapPin } from "@/components/map/kakao-map";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const revalidate = 3600;

export default async function MapPage() {
  const { data: announcements } = await supabase
    .from("announcements")
    .select("id, pan_nm, cnp_cd_nm, pan_ss, upp_ais_tp_nm, ais_tp_cd_nm, pan_nt_st_dt, clsg_dt, dtl_url, dtl_url_mob, lat, lng, address, complex_name")
    .not("lat", "is", null)
    .not("lng", "is", null)
    .order("pan_nt_st_dt", { ascending: false });

  const items = announcements ?? [];

  const pins: MapPin[] = items.map((item) => ({
    id: item.id,
    lat: item.lat,
    lng: item.lng,
    title: item.pan_nm,
    status: item.pan_ss,
    type: item.upp_ais_tp_nm,
    subType: item.ais_tp_cd_nm,
    region: item.cnp_cd_nm,
    address: item.address || item.complex_name || undefined,
    date: `${item.pan_nt_st_dt} ~ ${item.clsg_dt}`,
    url: item.dtl_url_mob || item.dtl_url || undefined,
  }));

  return <MapPageClient pins={pins} />;
}
