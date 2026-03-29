import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchRentalNotices, fetchSaleNotices } from "@/lib/api/myhome-v2";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const KAKAO_KEY = process.env.KAKAO_REST_API_KEY!;

async function geocode(address: string) {
  if (!address || address.trim().length < 5) return null;
  const res = await fetch(
    `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address.trim())}&size=1`,
    { headers: { Authorization: `KakaoAK ${KAKAO_KEY}` } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (data.documents?.length > 0) {
    return {
      lat: parseFloat(data.documents[0].y),
      lng: parseFloat(data.documents[0].x),
    };
  }
  return null;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let totalInserted = 0;

    // 공공임대
    let page = 1;
    while (true) {
      const { items } = await fetchRentalNotices({ pageNo: page, numOfRows: 100 });
      if (items.length === 0) break;

      const rows = [];
      for (const i of items) {
        const geo = await geocode(i.fullAdres);
        rows.push({
          pblanc_id: i.pblancId,
          house_sn: i.houseSn,
          pblanc_nm: i.pblancNm,
          sttus_nm: i.sttusNm,
          suply_instt_nm: i.suplyInsttNm,
          house_ty_nm: i.houseTyNm,
          suply_ty_nm: i.suplyTyNm,
          rcrit_pblanc_de: i.rcritPblancDe,
          przwner_presnatn_de: i.przwnerPresnatnDe,
          begin_de: i.beginDe,
          end_de: i.endDe,
          hsmp_nm: i.hsmpNm,
          brtc_nm: i.brtcNm,
          signgu_nm: i.signguNm,
          full_adres: i.fullAdres?.trim() || null,
          sum_suply_co: i.sumSuplyCo || null,
          rent_gtn: i.rentGtn || null,
          mt_rntchrg: i.mtRntchrg || null,
          pc_url: i.pcUrl,
          mobile_url: i.mobileUrl,
          detail_url: i.url,
          heat_mthd_nm: i.heatMthdNm,
          pnu: i.pnu,
          source: "rental",
          lat: geo?.lat || null,
          lng: geo?.lng || null,
          raw_data: i,
          updated_at: new Date().toISOString(),
        });
      }

      await supabase
        .from("announcements")
        .upsert(rows, { onConflict: "pblanc_id,house_sn,source" });

      totalInserted += rows.length;
      if (items.length < 100) break;
      page++;
    }

    // 공공분양
    page = 1;
    while (true) {
      const { items } = await fetchSaleNotices({ pageNo: page, numOfRows: 100 });
      if (items.length === 0) break;

      const rows = [];
      for (const i of items) {
        const geo = await geocode(i.fullAdres);
        rows.push({
          pblanc_id: i.pblancId,
          house_sn: i.houseSn,
          pblanc_nm: i.pblancNm,
          sttus_nm: i.sttusNm,
          suply_instt_nm: i.suplyInsttNm,
          house_ty_nm: i.houseTyNm,
          rcrit_pblanc_de: i.rcritPblancDe,
          przwner_presnatn_de: i.przwnerPresnatnDe,
          begin_de: i.beginDe,
          end_de: i.endDe,
          hsmp_nm: i.hsmpNm,
          brtc_nm: i.brtcNm,
          signgu_nm: i.signguNm,
          full_adres: i.fullAdres?.trim() || null,
          sum_suply_co: i.sumSuplyCo || null,
          pc_url: i.pcUrl,
          mobile_url: i.mobileUrl,
          detail_url: i.url,
          source: "sale",
          lat: geo?.lat || null,
          lng: geo?.lng || null,
          raw_data: i,
          updated_at: new Date().toISOString(),
        });
      }

      await supabase
        .from("announcements")
        .upsert(rows, { onConflict: "pblanc_id,house_sn,source" });

      totalInserted += rows.length;
      if (items.length < 100) break;
      page++;
    }

    return NextResponse.json({
      success: true,
      message: `동기화 완료: ${totalInserted}건`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("동기화 실패:", error);
    return NextResponse.json(
      { error: "동기화 중 오류", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
