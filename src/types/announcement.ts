/** DB announcements 테이블 (마이홈포털 API 기반) */
export interface Announcement {
  id: string;
  pblancId: string;
  houseSn: number;
  pblancNm: string;
  sttusNm: string;
  suplyInsttNm: string;
  houseTyNm: string;
  suplyTyNm: string | null;
  rcritPblancDe: string;
  przwnerPresnatnDe: string;
  beginDe: string;
  endDe: string;
  hsmpNm: string;
  brtcNm: string;
  signguNm: string;
  fullAdres: string | null;
  sumSuplyCo: number | null;
  rentGtn: number | null;
  mtRntchrg: number | null;
  pcUrl: string;
  mobileUrl: string;
  detailUrl: string;
  source: "rental" | "sale";
  lat: number | null;
  lng: number | null;
}
