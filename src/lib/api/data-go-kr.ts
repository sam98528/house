import type { DataGoKrResponse } from "@/types/announcement";

const BASE_URL = "https://apis.data.go.kr/B552555/lhLeaseNoticeInfo1";
const API_KEY = process.env.DATA_GO_KR_API_KEY!;

interface FetchAnnouncementsParams {
  pageNo?: number;
  numOfRows?: number;
  cnp_cd?: string; // 공고구분코드
  cgg_cd?: string; // 시군구코드
  spl_tp_cd?: string; // 공급유형코드
}

export async function fetchLHAnnouncements(
  params: FetchAnnouncementsParams = {}
) {
  const searchParams = new URLSearchParams({
    serviceKey: API_KEY,
    _type: "json",
    pageNo: String(params.pageNo ?? 1),
    numOfRows: String(params.numOfRows ?? 100),
    ...(params.cnp_cd && { cnp_cd: params.cnp_cd }),
    ...(params.cgg_cd && { cgg_cd: params.cgg_cd }),
    ...(params.spl_tp_cd && { spl_tp_cd: params.spl_tp_cd }),
  });

  const url = `${BASE_URL}/getNoticeInfo?${searchParams}`;

  const response = await fetch(url, {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`공공데이터 API 호출 실패: ${response.status}`);
  }

  const data: DataGoKrResponse<Record<string, unknown>> =
    await response.json();

  if (data.response.header.resultCode !== "00") {
    throw new Error(
      `API 에러: ${data.response.header.resultMsg}`
    );
  }

  return data.response.body;
}
