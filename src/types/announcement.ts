export type SupplyType = "분양" | "임대";
export type SupplyMethod = "특별공급" | "일반공급" | "무순위" | "잔여세대";
export type AnnouncementStatus = "접수예정" | "접수중" | "마감" | "당첨발표";

export interface Announcement {
  id: string;
  title: string;
  announcementNumber: string;
  regionSido: string;
  regionSigungu: string;
  supplyType: SupplyType;
  supplyMethod: SupplyMethod;
  areaSqm: number | null;
  unitCount: number | null;
  applyStartDate: string | null;
  applyEndDate: string | null;
  announceDate: string | null;
  moveInDate: string | null;
  priceInfo: string | null;
  detailUrl: string | null;
  status: AnnouncementStatus;
  rawData: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface UserFilter {
  id: string;
  userId: string;
  regions: string[];
  supplyTypes: SupplyType[];
  supplyMethods: SupplyMethod[];
  minArea: number | null;
  maxArea: number | null;
  householdType: string | null;
  incomeLevel: string | null;
  notifyEnabled: boolean;
}

export interface UserBookmark {
  id: string;
  userId: string;
  announcementId: string;
  createdAt: string;
}

// 공공데이터포털 API 응답 타입
export interface DataGoKrResponse<T> {
  response: {
    header: {
      resultCode: string;
      resultMsg: string;
    };
    body: {
      items: {
        item: T[];
      };
      numOfRows: number;
      pageNo: number;
      totalCount: number;
    };
  };
}

// 시도/시군구 지역 코드
export interface RegionCode {
  code: string;
  name: string;
  children?: RegionCode[];
}
