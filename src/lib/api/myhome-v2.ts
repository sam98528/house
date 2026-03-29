/**
 * 국토교통부 마이홈포털 공공주택 모집공고 조회 API
 * https://www.data.go.kr/data/15108420/openapi.do
 * Base: https://apis.data.go.kr/1613000/HWSPR02
 * 인증: serviceKey
 * 데이터: JSON
 */

const BASE_URL = "https://apis.data.go.kr/1613000/HWSPR02";
const API_KEY = process.env.DATA_GO_KR_API_KEY!;

/** 공공임대 모집공고 응답 아이템 */
export interface RentalNoticeItem {
  pblancId: string;        // 공고ID
  houseSn: number;         // 주택순번
  sttusNm: string;         // 상태 (일반공고, 정정공고)
  pblancNm: string;        // 공고명
  suplyInsttNm: string;    // 공급기관 (LH, SH 등)
  houseTyNm: string;       // 주택유형 (아파트, 다세대 등)
  suplyTyNm: string;       // 공급유형 (국민임대, 행복주택, 10년임대 등)
  rcritPblancDe: string;   // 모집공고일 (YYYYMMDD)
  przwnerPresnatnDe: string; // 당첨자발표일 (YYYYMMDD)
  beginDe: string;         // 모집시작일 (YYYYMMDD)
  endDe: string;           // 모집종료일 (YYYYMMDD)
  hsmpNm: string;          // 단지명
  brtcNm: string;          // 광역시도명
  signguNm: string;        // 시군구명
  fullAdres: string;       // 전체 도로명 주소
  sumSuplyCo: number;      // 공급호수
  rentGtn: number;         // 임대보증금 (원)
  mtRntchrg: number;       // 월임대료 (원)
  totHshldCo: string;      // 총 세대수
  heatMthdNm: string;      // 난방방식
  url: string;             // LH 상세 URL
  pcUrl: string;           // 마이홈 PC URL
  mobileUrl: string;       // 마이홈 모바일 URL
  refrnc: string;          // 참고사항
  pnu: string;             // PNU 코드
}

/** 공공분양 모집공고 응답 아이템 */
export interface SaleNoticeItem {
  pblancId: string;
  houseSn: number;
  sttusNm: string;
  pblancNm: string;
  suplyInsttNm: string;
  houseTyNm: string;
  rcritPblancDe: string;
  przwnerPresnatnDe: string;
  beginDe: string;
  endDe: string;
  hsmpNm: string;
  brtcNm: string;
  signguNm: string;
  fullAdres: string;
  sumSuplyCo: number;
  url: string;
  pcUrl: string;
  mobileUrl: string;
}

interface ApiResponse<T> {
  response: {
    header: { resultCode: string; resultMsg: string };
    body: {
      totalCount: string;
      numOfRows: string;
      pageNo: string;
      item: T[];
    };
  };
}

/** 공공임대 모집공고 조회 */
export async function fetchRentalNotices(params?: {
  pageNo?: number;
  numOfRows?: number;
  brtcCode?: string;
  signguCode?: string;
  suplyTy?: string;
  houseTy?: string;
  yearMtBegin?: string;
  yearMtEnd?: string;
}): Promise<{ items: RentalNoticeItem[]; totalCount: number }> {
  const searchParams = new URLSearchParams({
    serviceKey: API_KEY,
    numOfRows: String(params?.numOfRows ?? 100),
    pageNo: String(params?.pageNo ?? 1),
  });

  if (params?.brtcCode) searchParams.set("brtcCode", params.brtcCode);
  if (params?.signguCode) searchParams.set("signguCode", params.signguCode);
  if (params?.suplyTy) searchParams.set("suplyTy", params.suplyTy);
  if (params?.houseTy) searchParams.set("houseTy", params.houseTy);
  if (params?.yearMtBegin) searchParams.set("yearMtBegin", params.yearMtBegin);
  if (params?.yearMtEnd) searchParams.set("yearMtEnd", params.yearMtEnd);

  const res = await fetch(`${BASE_URL}/rsdtRcritNtcList?${searchParams}`);
  if (!res.ok) throw new Error(`임대 공고 API 실패: ${res.status}`);

  const data: ApiResponse<RentalNoticeItem> = await res.json();
  if (data.response.header.resultCode !== "00") {
    throw new Error(`API 에러: ${data.response.header.resultMsg}`);
  }

  return {
    items: data.response.body.item ?? [],
    totalCount: parseInt(data.response.body.totalCount),
  };
}

/** 공공분양 모집공고 조회 */
export async function fetchSaleNotices(params?: {
  pageNo?: number;
  numOfRows?: number;
  brtcCode?: string;
  signguCode?: string;
  houseTy?: string;
  yearMtBegin?: string;
  yearMtEnd?: string;
}): Promise<{ items: SaleNoticeItem[]; totalCount: number }> {
  const searchParams = new URLSearchParams({
    serviceKey: API_KEY,
    numOfRows: String(params?.numOfRows ?? 100),
    pageNo: String(params?.pageNo ?? 1),
  });

  if (params?.brtcCode) searchParams.set("brtcCode", params.brtcCode);
  if (params?.signguCode) searchParams.set("signguCode", params.signguCode);
  if (params?.houseTy) searchParams.set("houseTy", params.houseTy);
  if (params?.yearMtBegin) searchParams.set("yearMtBegin", params.yearMtBegin);
  if (params?.yearMtEnd) searchParams.set("yearMtEnd", params.yearMtEnd);

  const res = await fetch(`${BASE_URL}/ltRsdtRcritNtcList?${searchParams}`);
  if (!res.ok) throw new Error(`분양 공고 API 실패: ${res.status}`);

  const data: ApiResponse<SaleNoticeItem> = await res.json();
  if (data.response.header.resultCode !== "00") {
    throw new Error(`API 에러: ${data.response.header.resultMsg}`);
  }

  return {
    items: data.response.body.item ?? [],
    totalCount: parseInt(data.response.body.totalCount),
  };
}

/** YYYYMMDD → YYYY.MM.DD */
export function formatDate(yyyymmdd: string): string {
  if (!yyyymmdd || yyyymmdd.length !== 8) return yyyymmdd;
  return `${yyyymmdd.slice(0, 4)}.${yyyymmdd.slice(4, 6)}.${yyyymmdd.slice(6, 8)}`;
}

/** 원 → 만원 표시 */
export function formatWon(won: number): string {
  if (!won) return "-";
  const man = Math.round(won / 10000);
  if (man >= 10000) return `${(man / 10000).toFixed(1)}억`;
  return `${man.toLocaleString()}만`;
}
