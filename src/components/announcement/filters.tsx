"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { Badge } from "@/components/ui/badge";

const REGIONS = [
  "서울특별시", "경기도", "인천광역시", "부산광역시", "대구광역시",
  "광주광역시", "대전광역시", "울산광역시", "세종특별자치시",
  "강원특별자치도", "충청북도", "충청남도", "전북특별자치도",
  "전라남도", "경상북도", "경상남도", "제주특별자치도",
];

export function AnnouncementFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeRegion = searchParams.get("region") || "";
  const activeType = searchParams.get("type") || "";
  const search = searchParams.get("q") || "";

  const setFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
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

  const hasFilters = activeRegion || activeType || search;

  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="공고명, 단지명 검색..."
        defaultValue={search}
        onChange={(e) => {
          const val = e.target.value;
          setTimeout(() => setFilter("q", val), 300);
        }}
        className="w-full px-3 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        <Badge
          variant={activeType === "rental" ? "default" : "outline"}
          className="whitespace-nowrap cursor-pointer shrink-0"
          onClick={() => toggleFilter("type", "rental")}
        >
          🏢 공공임대
        </Badge>
        <Badge
          variant={activeType === "sale" ? "default" : "outline"}
          className="whitespace-nowrap cursor-pointer shrink-0"
          onClick={() => toggleFilter("type", "sale")}
        >
          🏠 공공분양
        </Badge>

        {/* 지역 필터 — 스크롤 가능 */}
        {REGIONS.slice(0, 8).map((r) => (
          <Badge
            key={r}
            variant={activeRegion === r ? "default" : "outline"}
            className="whitespace-nowrap cursor-pointer shrink-0 text-xs"
            onClick={() => toggleFilter("region", r)}
          >
            {r.replace(/특별자치도|특별자치시|광역시|특별시/g, "")}
          </Badge>
        ))}
      </div>

      {hasFilters && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>필터:</span>
          {activeRegion && (
            <Badge variant="secondary" className="text-xs cursor-pointer" onClick={() => setFilter("region", "")}>
              {activeRegion} ✕
            </Badge>
          )}
          {activeType && (
            <Badge variant="secondary" className="text-xs cursor-pointer" onClick={() => setFilter("type", "")}>
              {activeType === "rental" ? "공공임대" : "공공분양"} ✕
            </Badge>
          )}
          {search && (
            <Badge variant="secondary" className="text-xs cursor-pointer" onClick={() => setFilter("q", "")}>
              &quot;{search}&quot; ✕
            </Badge>
          )}
          <button onClick={clearAll} className="text-red-400 hover:text-red-600 ml-auto">전체 해제</button>
        </div>
      )}
    </div>
  );
}
