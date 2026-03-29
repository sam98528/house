export type SupplyType = "분양" | "임대";
export type AnnouncementType = "APT" | "오피스텔" | "무순위" | "민간임대" | "임의공급";
export type AnnouncementStatus = "접수예정" | "접수중" | "마감" | "당첨발표";

/** DB announcements 테이블 */
export interface Announcement {
  id: string;
  houseManageNo: string;
  pblancNo: string;
  houseNm: string;
  hssplyAdres: string | null;
  supplyType: SupplyType;
  announcementType: AnnouncementType;
  totSuplyHshldco: number | null;
  rceptBgnde: string | null;
  rceptEndde: string | null;
  przwnerPresnatnDe: string | null;
  cntrctCnclsBgnde: string | null;
  cntrctCnclsEndde: string | null;
  mvnPrearngeYm: string | null;
  bsnsMbyNm: string | null;
  mdhsTelno: string | null;
  hmpgAdres: string | null;
  subscrptAreaCode: string | null;
  status: AnnouncementStatus;
  rawData: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/** DB announcement_models 테이블 (주택형별) */
export interface AnnouncementModel {
  id: string;
  announcementId: string;
  houseTy: string;
  suplyAr: number | null;
  suplyHshldco: number | null;
  spsplyHshldco: number | null;
  lttotTopAmount: number | null;
  mnychHshldco: number | null; // 다자녀
  nwwdsHshldco: number | null; // 신혼부부
  lfeFrstHshldco: number | null; // 생애최초
  oldParntsSuportHshldco: number | null; // 노부모부양
  insttRecomendHshldco: number | null; // 기관추천
}

/** 특별공급 가구유형 */
export type HouseholdType =
  | "다자녀"
  | "신혼부부"
  | "생애최초"
  | "노부모부양"
  | "기관추천"
  | "청년"
  | "신생아";

/** DB user_filters 테이블 */
export interface UserFilter {
  id: string;
  userId: string;
  regions: string[];
  supplyTypes: SupplyType[];
  announcementTypes: AnnouncementType[];
  householdType: HouseholdType | null;
  minArea: number | null;
  maxArea: number | null;
  maxPrice: number | null;
  notifyEnabled: boolean;
}

/** DB user_bookmarks 테이블 */
export interface UserBookmark {
  id: string;
  userId: string;
  announcementId: string;
  createdAt: string;
}

/** 시도/시군구 지역 코드 */
export interface RegionCode {
  code: string;
  name: string;
  children?: RegionCode[];
}
