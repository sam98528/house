/**
 * 청약홈 분양정보 조회 서비스 (한국부동산원)
 * https://api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1/
 * Swagger: https://infuser.odcloud.kr/api/stages/37000/api-docs
 */

const BASE_URL =
  "https://api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1";
const API_KEY = process.env.DATA_GO_KR_API_KEY!;

type Endpoint =
  | "getAPTLttotPblancDetail"
  | "getAPTLttotPblancMdl"
  | "getUrbtyOfctlLttotPblancDetail"
  | "getUrbtyOfctlLttotPblancMdl"
  | "getRemndrLttotPblancDetail"
  | "getRemndrLttotPblancMdl"
  | "getPblPvtRentLttotPblancDetail"
  | "getPblPvtRentLttotPblancMdl"
  | "getOPTLttotPblancDetail"
  | "getOPTLttotPblancMdl";

interface ApplyHomeParams {
  page?: number;
  perPage?: number;
  cond?: Record<string, string>;
}

interface ApplyHomeResponse<T> {
  currentCount: number;
  data: T[];
  matchCount: number;
  page: number;
  perPage: number;
  totalCount: number;
}

export async function fetchApplyHome<T = Record<string, unknown>>(
  endpoint: Endpoint,
  params: ApplyHomeParams = {}
): Promise<ApplyHomeResponse<T>> {
  const searchParams = new URLSearchParams({
    serviceKey: API_KEY,
    page: String(params.page ?? 1),
    perPage: String(params.perPage ?? 100),
  });

  if (params.cond) {
    for (const [key, value] of Object.entries(params.cond)) {
      searchParams.set(`cond[${key}]`, value);
    }
  }

  const url = `${BASE_URL}/${endpoint}?${searchParams}`;

  const response = await fetch(url, {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`청약홈 API 호출 실패: ${response.status}`);
  }

  return response.json();
}

// APT 분양정보 조회
export function fetchAPTAnnouncements(params?: {
  page?: number;
  perPage?: number;
  houseName?: string;
  areaCode?: string;
  startDate?: string;
  endDate?: string;
}) {
  const cond: Record<string, string> = {};

  if (params?.houseName) cond["HOUSE_NM::LIKE"] = params.houseName;
  if (params?.areaCode)
    cond["SUBSCRPT_AREA_CODE::EQ"] = params.areaCode;
  if (params?.startDate)
    cond["RCRIT_PBLANC_DE::GTE"] = params.startDate;
  if (params?.endDate)
    cond["RCRIT_PBLANC_DE::LTE"] = params.endDate;

  return fetchApplyHome("getAPTLttotPblancDetail", {
    page: params?.page,
    perPage: params?.perPage,
    cond: Object.keys(cond).length > 0 ? cond : undefined,
  });
}

// 무순위/잔여세대 조회
export function fetchRemainingAnnouncements(params?: {
  page?: number;
  perPage?: number;
  houseName?: string;
  areaCode?: string;
}) {
  const cond: Record<string, string> = {};

  if (params?.houseName) cond["HOUSE_NM::LIKE"] = params.houseName;
  if (params?.areaCode)
    cond["SUBSCRPT_AREA_CODE::EQ"] = params.areaCode;

  return fetchApplyHome("getRemndrLttotPblancDetail", {
    page: params?.page,
    perPage: params?.perPage,
    cond: Object.keys(cond).length > 0 ? cond : undefined,
  });
}

// 오피스텔/도시형 조회
export function fetchOfficetelAnnouncements(params?: {
  page?: number;
  perPage?: number;
  houseName?: string;
  areaCode?: string;
}) {
  const cond: Record<string, string> = {};

  if (params?.houseName) cond["HOUSE_NM::LIKE"] = params.houseName;
  if (params?.areaCode)
    cond["SUBSCRPT_AREA_CODE::EQ"] = params.areaCode;

  return fetchApplyHome("getUrbtyOfctlLttotPblancDetail", {
    page: params?.page,
    perPage: params?.perPage,
    cond: Object.keys(cond).length > 0 ? cond : undefined,
  });
}
