/**
 * LH 분양임대공고문 조회 서비스
 * 문서: api_docs/OpenAPI활용가이드_한국토지주택공사_분양임대공고조회_20260316.md
 * URL: http://apis.data.go.kr/B552555/lhLeaseNoticeInfo1/lhLeaseNoticeInfo1
 * 인증: ServiceKey (URL Encode)
 * 응답: JSON 배열 [{dsSch}, {resHeader, dsList}]
 * 일일한도: 10,000건 / TPS: 30
 */

const BASE_URL =
  "http://apis.data.go.kr/B552555/lhLeaseNoticeInfo1/lhLeaseNoticeInfo1";
const API_KEY = process.env.DATA_GO_KR_API_KEY!;

/** 공고유형코드 */
export const LH_TYPE_CODES = {
  "01": "토지",
  "05": "분양주택",
  "06": "임대주택",
  "13": "주거복지",
  "22": "상가",
  "39": "신혼희망타운",
} as const;

/** 지역코드 */
export const LH_REGION_CODES = {
  "11": "서울특별시",
  "26": "부산광역시",
  "27": "대구광역시",
  "28": "인천광역시",
  "29": "광주광역시",
  "30": "대전광역시",
  "31": "울산광역시",
  "36110": "세종특별자치시",
  "41": "경기도",
  "42": "강원도",
  "43": "충청북도",
  "44": "충청남도",
  "52": "전북특별자치도",
  "46": "전라남도",
  "47": "경상북도",
  "48": "경상남도",
  "50": "제주특별자치도",
} as const;

/** 공고상태 */
export type LHStatus =
  | "공고중"
  | "접수중"
  | "접수마감"
  | "상담요청"
  | "정정공고중";

export type LHTypeCode = keyof typeof LH_TYPE_CODES;
export type LHRegionCode = keyof typeof LH_REGION_CODES;

interface FetchLHParams {
  /** 한 페이지 결과 수 (필수) */
  PG_SZ?: number;
  /** 페이지 번호 (필수) */
  PAGE?: number;
  /** 공고명 검색 */
  PAN_NM?: string;
  /** 공고유형코드: 01=토지, 05=분양주택, 06=임대주택, 13=주거복지, 22=상가, 39=신혼희망타운 */
  UPP_AIS_TP_CD?: LHTypeCode;
  /** 지역코드 */
  CNP_CD?: LHRegionCode;
  /** 공고상태코드 */
  PAN_SS?: LHStatus;
  /** 기간검색 게시일-시작일 (필수, YYYYMMDD, 초기값: 현재일-2개월) */
  PAN_ST_DT: string;
  /** 기간검색 게시일-종료일 (필수, YYYYMMDD, 초기값: 현재일) */
  PAN_ED_DT: string;
  /** 기간검색 마감일-시작일 (YYYYMMDD) */
  CLSG_ST_DT?: string;
  /** 기간검색 마감일-종료일 (YYYYMMDD) */
  CLSG_ED_DT?: string;
}

/** API 응답의 공고 아이템 */
export interface LHAnnouncementItem {
  RNUM: string;
  UPP_AIS_TP_NM: string; // 공고유형명 (임대주택, 분양주택 등)
  AIS_TP_CD_NM: string; // 공고세부유형명 (행복주택, 국민임대 등)
  PAN_NM: string; // 공고명
  CNP_CD_NM: string; // 지역명
  PAN_NT_ST_DT: string; // 공고게시일 (2019.07.23)
  CLSG_DT: string; // 공고마감일 (2019.08.22)
  PAN_SS: string; // 공고상태 (공고중/접수중/접수마감)
  ALL_CNT: string; // 전체조회건수
  DTL_URL: string; // 공고상세URL (PC)
  DTL_URL_MOB: string; // 공고상세URL (모바일)
  SPL_INF_TP_CD: string; // 공급정보구분코드 (상세 API 연동용)
  CCR_CNNT_SYS_DS_CD: string; // 고객센터연계시스템구분코드
  PAN_ID: string; // 공고아이디
  UPP_AIS_TP_CD: string; // 상위매물유형코드
  AIS_TP_CD: string; // 매물유형코드
  PAN_DT?: string; // 모집공고일 (YYYYMMDD, 토지/상가는 미제공)
}

/**
 * LH API 응답 구조:
 * [
 *   { "dsSch": [{검색조건}] },
 *   { "resHeader": [{"SS_CODE":"Y","RS_DTTM":"..."}], "dsList": [{공고항목},...] }
 * ]
 */
type LHRawResponse = [
  { dsSch: Record<string, string>[] },
  { resHeader: { SS_CODE: string; RS_DTTM: string }[]; dsList: LHAnnouncementItem[] },
];

export async function fetchLHAnnouncements(
  params: FetchLHParams
): Promise<{ items: LHAnnouncementItem[]; totalCount: number }> {
  const searchParams = new URLSearchParams({
    serviceKey: API_KEY,
    PG_SZ: String(params.PG_SZ ?? 10),
    PAGE: String(params.PAGE ?? 1),
    PAN_ST_DT: params.PAN_ST_DT,
    PAN_ED_DT: params.PAN_ED_DT,
  });

  if (params.PAN_NM) searchParams.set("PAN_NM", params.PAN_NM);
  if (params.UPP_AIS_TP_CD)
    searchParams.set("UPP_AIS_TP_CD", params.UPP_AIS_TP_CD);
  if (params.CNP_CD) searchParams.set("CNP_CD", params.CNP_CD);
  if (params.PAN_SS) searchParams.set("PAN_SS", params.PAN_SS);
  if (params.CLSG_ST_DT) searchParams.set("CLSG_ST_DT", params.CLSG_ST_DT);
  if (params.CLSG_ED_DT) searchParams.set("CLSG_ED_DT", params.CLSG_ED_DT);

  const url = `${BASE_URL}?${searchParams}`;

  const response = await fetch(url, {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`LH API 호출 실패: ${response.status}`);
  }

  const data: LHRawResponse = await response.json();

  // 응답 검증
  if (!data || data.length < 2) {
    return { items: [], totalCount: 0 };
  }

  const { resHeader, dsList } = data[1];

  if (!resHeader?.[0] || resHeader[0].SS_CODE !== "Y") {
    return { items: [], totalCount: 0 };
  }

  const items = dsList ?? [];
  const totalCount = items.length > 0 ? Number(items[0].ALL_CNT) : 0;

  return { items, totalCount };
}

/** YYYYMMDD 형식 날짜 생성 헬퍼 */
export function formatDateForLH(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}
