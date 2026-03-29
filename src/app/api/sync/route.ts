import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  fetchLHAnnouncements,
  formatDateForLH,
  type LHAnnouncementItem,
} from "@/lib/api/data-go-kr";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function toAnnouncement(item: LHAnnouncementItem) {
  return {
    pan_id: item.PAN_ID,
    pan_nm: item.PAN_NM,
    upp_ais_tp_cd: item.UPP_AIS_TP_CD,
    upp_ais_tp_nm: item.UPP_AIS_TP_NM,
    ais_tp_cd: item.AIS_TP_CD,
    ais_tp_cd_nm: item.AIS_TP_CD_NM,
    cnp_cd_nm: item.CNP_CD_NM,
    pan_nt_st_dt: item.PAN_NT_ST_DT,
    clsg_dt: item.CLSG_DT,
    pan_dt: item.PAN_DT || null,
    pan_ss: item.PAN_SS,
    dtl_url: item.DTL_URL,
    dtl_url_mob: item.DTL_URL_MOB || null,
    spl_inf_tp_cd: item.SPL_INF_TP_CD,
    ccr_cnnt_sys_ds_cd: item.CCR_CNNT_SYS_DS_CD,
    source: "lh",
    raw_data: item,
    updated_at: new Date().toISOString(),
  };
}

export async function GET(request: Request) {
  // Cron 또는 수동 실행 허용 (개발 중에는 인증 생략)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // CRON_SECRET이 설정된 경우에만 인증 확인
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const twoMonthsAgo = new Date(now);
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    // 분양주택(05) + 임대주택(06) + 신혼희망타운(39) 가져오기
    const typeCodes = ["05", "06", "39"] as const;
    let totalInserted = 0;
    let totalUpdated = 0;

    for (const typeCode of typeCodes) {
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const { items, totalCount } = await fetchLHAnnouncements({
          PG_SZ: 100,
          PAGE: page,
          UPP_AIS_TP_CD: typeCode,
          PAN_ST_DT: formatDateForLH(twoMonthsAgo),
          PAN_ED_DT: formatDateForLH(now),
        });

        if (items.length === 0) break;

        // Upsert (pan_id + source 기준)
        const rows = items.map(toAnnouncement);

        const { error } = await supabase
          .from("announcements")
          .upsert(rows, { onConflict: "pan_id,source" });

        if (error) {
          console.error(`Upsert 에러 (${typeCode}, page ${page}):`, error);
        } else {
          totalInserted += rows.length;
        }

        hasMore = page * 100 < totalCount;
        page++;

        // API rate limit (30 TPS) 방지
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    return NextResponse.json({
      success: true,
      message: `동기화 완료: ${totalInserted}건 처리`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("동기화 실패:", error);
    return NextResponse.json(
      {
        error: "동기화 중 오류 발생",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
