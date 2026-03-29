"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const REGIONS = [
  "서울특별시",
  "경기도",
  "인천광역시",
  "부산광역시",
  "대구광역시",
  "광주광역시",
  "대전광역시",
  "울산광역시",
  "세종특별자치시",
  "강원특별자치도",
  "충청북도",
  "충청남도",
  "전북특별자치도",
  "전라남도",
  "경상북도",
  "경상남도",
  "제주특별자치도",
];

const STATUSES = ["공고중", "접수중", "접수마감", "정정공고중"];

const TYPES = [
  { label: "🏢 임대주택", value: "임대주택" },
  { label: "🏠 분양주택", value: "분양주택" },
  { label: "💒 신혼희망타운", value: "공공분양(신혼희망)" },
];

const SUB_TYPES = [
  "국민임대",
  "영구임대",
  "공공임대",
  "행복주택",
  "분양주택",
  "공공분양(신혼희망)",
];

export function AnnouncementFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeRegion = searchParams.get("region") || "";
  const activeStatus = searchParams.get("status") || "";
  const activeType = searchParams.get("type") || "";
  const activeSubType = searchParams.get("subtype") || "";
  const search = searchParams.get("q") || "";

  const setFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const toggleFilter = useCallback(
    (key: string, value: string) => {
      const current = searchParams.get(key);
      setFilter(key, current === value ? "" : value);
    },
    [searchParams, setFilter]
  );

  const clearAll = useCallback(() => {
    router.push(pathname);
  }, [router, pathname]);

  const hasFilters = activeRegion || activeStatus || activeType || activeSubType || search;

  return (
    <div className="space-y-3">
      {/* 검색 */}
      <input
        type="text"
        placeholder="공고명 검색..."
        defaultValue={search}
        onChange={(e) => {
          const timer = setTimeout(() => setFilter("q", e.target.value), 300);
          return () => clearTimeout(timer);
        }}
        className="w-full px-3 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* 상단 빠른 필터 */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TYPES.map((t) => (
          <Badge
            key={t.value}
            variant={activeType === t.value ? "default" : "outline"}
            className="whitespace-nowrap cursor-pointer shrink-0"
            onClick={() => toggleFilter("type", t.value)}
          >
            {t.label}
          </Badge>
        ))}
        <Badge
          variant={activeStatus === "공고중" ? "default" : "outline"}
          className="whitespace-nowrap cursor-pointer shrink-0"
          onClick={() => toggleFilter("status", "공고중")}
        >
          공고중
        </Badge>
        <Badge
          variant={activeStatus === "접수중" ? "default" : "outline"}
          className="whitespace-nowrap cursor-pointer shrink-0"
          onClick={() => toggleFilter("status", "접수중")}
        >
          접수중
        </Badge>

        {/* 상세 필터 (Sheet) */}
        <Sheet>
          <SheetTrigger
            className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs whitespace-nowrap cursor-pointer shrink-0 border-input hover:bg-accent"
          >
            ⚙️ 상세필터
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[70vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>상세 필터</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 mt-4">
              {/* 지역 */}
              <div>
                <h3 className="text-sm font-medium mb-2">지역</h3>
                <div className="flex flex-wrap gap-2">
                  {REGIONS.map((r) => (
                    <Badge
                      key={r}
                      variant={activeRegion === r ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => toggleFilter("region", r)}
                    >
                      {r.replace("특별자치도", "").replace("특별자치시", "").replace("광역시", "").replace("특별시", "")}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* 공고상태 */}
              <div>
                <h3 className="text-sm font-medium mb-2">공고상태</h3>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((s) => (
                    <Badge
                      key={s}
                      variant={activeStatus === s ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => toggleFilter("status", s)}
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* 세부유형 */}
              <div>
                <h3 className="text-sm font-medium mb-2">세부유형</h3>
                <div className="flex flex-wrap gap-2">
                  {SUB_TYPES.map((st) => (
                    <Badge
                      key={st}
                      variant={activeSubType === st ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => toggleFilter("subtype", st)}
                    >
                      {st}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* 활성 필터 표시 */}
      {hasFilters && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>필터:</span>
          {activeRegion && (
            <Badge variant="secondary" className="text-xs gap-1" onClick={() => setFilter("region", "")}>
              {activeRegion} ✕
            </Badge>
          )}
          {activeStatus && (
            <Badge variant="secondary" className="text-xs gap-1" onClick={() => setFilter("status", "")}>
              {activeStatus} ✕
            </Badge>
          )}
          {activeType && (
            <Badge variant="secondary" className="text-xs gap-1" onClick={() => setFilter("type", "")}>
              {activeType} ✕
            </Badge>
          )}
          {activeSubType && (
            <Badge variant="secondary" className="text-xs gap-1" onClick={() => setFilter("subtype", "")}>
              {activeSubType} ✕
            </Badge>
          )}
          {search && (
            <Badge variant="secondary" className="text-xs gap-1" onClick={() => setFilter("q", "")}>
              &quot;{search}&quot; ✕
            </Badge>
          )}
          <button onClick={clearAll} className="text-red-400 hover:text-red-600 ml-auto">
            전체 해제
          </button>
        </div>
      )}
    </div>
  );
}
