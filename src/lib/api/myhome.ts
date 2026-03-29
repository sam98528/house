/**
 * 마이홈포털 공공임대주택 단지정보 조회 서비스
 * 문서: api_docs/OpenAPI활용가이드_한국토지주택공사_공공임대주택_단지정보_v1_2_최종.md
 * URL: https://data.myhome.go.kr/rentalHouseList
 * 인증: ServiceKey
 * 응답: JSON { code, hsmpList: [...], msg }
 * TPS: 30
 */

const BASE_URL = "https://data.myhome.go.kr/rentalHouseList";
const API_KEY = process.env.DATA_GO_KR_API_KEY!;

/** 광역시도 코드 (brtcCode) — LH API 지역코드와 동일 체계 */
export const MYHOME_BRTC_CODES = {
  "11": "서울특별시",
  "26": "부산광역시",
  "27": "대구광역시",
  "28": "인천광역시",
  "29": "광주광역시",
  "30": "대전광역시",
  "31": "울산광역시",
  "36": "세종특별자치시",
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

export type BrtcCode = keyof typeof MYHOME_BRTC_CODES;

interface FetchRentalHouseParams {
  /** 광역시도 코드 (필수) */
  brtcCode: BrtcCode;
  /** 시군구 코드 (필수, 3자리) */
  signguCode: string;
  /** 페이지당 데이터 개수 (기본: 10) */
  numOfRows?: number;
  /** 페이지 번호 (기본: 1) */
  pageNo?: number;
}

/** 공공임대주택 단지 정보 */
export interface RentalHouseItem {
  hsmpSn: number; // 단지 식별자
  insttNm: string; // 기관명 (SH공사, LH서울 등)
  brtcCode: string; // 광역시도 코드
  brtcNm: string; // 광역시도명
  signguCode: string; // 시군구 코드
  signguNm: string; // 시군구명
  hsmpNm: string; // 단지명
  rnAdres: string; // 도로명 주소
  pnu: string; // PNU 코드
  competDe: string | Record<string, never>; // 준공일자 (YYYYMMDD, 없으면 빈 객체)
  hshldCo: number; // 세대수
  suplyTyNm: string; // 공급유형명 (50년임대, 매입임대, 국민임대 등)
  styleNm: string; // 형명
  suplyPrvuseAr: number; // 공급 전용면적 (㎡)
  suplyCmnuseAr: number; // 공급 공용면적 (㎡)
  houseTyNm: string | Record<string, never>; // 주택유형명 (아파트, 다가구주택 등)
  heatMthdDetailNm: string | Record<string, never>; // 난방방식
  buldStleNm: string | Record<string, never>; // 건물형태 (복도식 등)
  elvtrInstlAtNm: string | Record<string, never>; // 승강기 설치여부
  parkngCo: number; // 주차수
  bassRentGtn: number; // 기본 임대보증금 (원)
  bassMtRntchrg: number; // 기본 월임대료 (원)
  bassCnvrsGtnLmt: number; // 기본 전환보증금 (원)
}

interface MyHomeResponse {
  code: string; // "000" = 정상
  hsmpList: (RentalHouseItem & {
    numOfRows: string;
    pageNo: number;
    totalCount: number;
  })[];
  msg: string;
}

export async function fetchRentalHouseList(
  params: FetchRentalHouseParams
): Promise<{
  items: RentalHouseItem[];
  totalCount: number;
  page: number;
}> {
  const searchParams = new URLSearchParams({
    ServiceKey: API_KEY,
    brtcCode: params.brtcCode,
    signguCode: params.signguCode,
  });

  if (params.numOfRows)
    searchParams.set("numOfRows", String(params.numOfRows));
  if (params.pageNo) searchParams.set("pageNo", String(params.pageNo));

  const url = `${BASE_URL}?${searchParams}`;

  const response = await fetch(url, {
    next: { revalidate: 86400 }, // 단지정보는 하루 캐시
  });

  if (!response.ok) {
    throw new Error(`마이홈 API 호출 실패: ${response.status}`);
  }

  const data: MyHomeResponse = await response.json();

  if (data.code !== "000") {
    throw new Error(`마이홈 API 에러: ${data.msg} (code: ${data.code})`);
  }

  const items = data.hsmpList ?? [];
  const totalCount = items.length > 0 ? items[0].totalCount : 0;
  const page = items.length > 0 ? items[0].pageNo : 1;

  return { items, totalCount, page };
}

/** 빈 객체 응답을 null로 변환하는 헬퍼 (API가 빈 값을 {} 로 반환) */
export function normalizeEmptyObj<T>(
  value: T | Record<string, never>
): T | null {
  if (typeof value === "object" && value !== null && Object.keys(value).length === 0) {
    return null;
  }
  return value as T;
}
