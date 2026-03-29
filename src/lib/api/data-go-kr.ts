/**
 * LH 분양임대공고문 조회 서비스
 * https://www.data.go.kr/data/15058530/openapi.do
 * Base: http://apis.data.go.kr/B552555/lhLeaseNoticeInfo1/lhLeaseNoticeInfo1
 */

const BASE_URL =
  "http://apis.data.go.kr/B552555/lhLeaseNoticeInfo1/lhLeaseNoticeInfo1";
const API_KEY = process.env.DATA_GO_KR_API_KEY!;

/** 공고유형코드 */
export type LHAnnouncementType =
  | "01" // 토지
  | "05" // 분양주택
  | "06"; // 임대주택

/** 공고상태 */
export type LHAnnouncementStatus =
  | "공고중"
  | "접수중"
  | "접수마감"
  | "상담요청"
  | "정정공고중";

interface FetchLHParams {
  /** 페이지 크기 (필수) */
  PG_SZ?: number;
  /** 페이지 번호 (필수) */
  PAGE?: number;
  /** 공고명 검색 */
  PAN_NM?: string;
  /** 공고유형코드: 01=토지, 05=분양주택, 06=임대주택 */
  UPP_AIS_TP_CD?: LHAnnouncementType;
  /** 지역코드 */
  CNP_CD?: string;
  /** 공고상태 */
  PAN_SS?: LHAnnouncementStatus;
  /** 공고게시일 (YYYY.MM.DD, 필수) */
  PAN_NT_ST_DT: string;
  /** 공고마감일 (YYYY.MM.DD, 필수) */
  CLSG_DT: string;
}

export interface LHAnnouncementItem {
  UPP_AIS_TP_NM: string; // 공고유형명
  PAN_NM: string; // 공고명
  CNP_CD_NM: string; // 지역명
  PAN_SS: string; // 공고상태
  DTL_URL: string; // 상세 URL
  ALL_CNT: string; // 전체 건수
  [key: string]: unknown;
}

interface LHResponse {
  SS_CODE: string;
  dsList?: LHAnnouncementItem[];
}

export async function fetchLHAnnouncements(
  params: FetchLHParams
): Promise<{ items: LHAnnouncementItem[]; totalCount: number }> {
  const searchParams = new URLSearchParams({
    ServiceKey: API_KEY,
    PG_SZ: String(params.PG_SZ ?? 100),
    PAGE: String(params.PAGE ?? 1),
    PAN_NT_ST_DT: params.PAN_NT_ST_DT,
    CLSG_DT: params.CLSG_DT,
  });

  if (params.PAN_NM) searchParams.set("PAN_NM", params.PAN_NM);
  if (params.UPP_AIS_TP_CD)
    searchParams.set("UPP_AIS_TP_CD", params.UPP_AIS_TP_CD);
  if (params.CNP_CD) searchParams.set("CNP_CD", params.CNP_CD);
  if (params.PAN_SS) searchParams.set("PAN_SS", params.PAN_SS);

  const url = `${BASE_URL}?${searchParams}`;

  const response = await fetch(url, {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`LH API 호출 실패: ${response.status}`);
  }

  const data: LHResponse[] = await response.json();

  if (!data || data.length === 0 || data[0].SS_CODE !== "S") {
    return { items: [], totalCount: 0 };
  }

  const items = data[0].dsList ?? [];
  const totalCount = items.length > 0 ? Number(items[0].ALL_CNT) : 0;

  return { items, totalCount };
}
