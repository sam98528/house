"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { KakaoMap, type MapPin, type KakaoMapHandle } from "./kakao-map";
import { DetailPanel } from "./detail-panel";

const RECRUIT_OPTIONS = ["전체", "모집중", "모집예정", "모집완료"] as const;
const REGIONS = [
  "서울특별시", "경기도", "인천광역시", "부산광역시", "대구광역시",
  "광주광역시", "대전광역시", "울산광역시", "세종특별자치시",
  "강원특별자치도", "충청북도", "충청남도", "전북특별자치도",
  "전라남도", "경상북도", "경상남도", "제주특별자치도",
];
const SUPPLY_TYPES = [
  "국민임대", "매입임대", "영구임대", "전세임대", "행복주택",
  "10년임대", "50년임대", "공공지원민간임대주택",
];
const shortRegion = (r: string) => r.replace(/특별자치도|특별자치시|광역시|특별시/g, "").replace(/도$/, "");

const recruitDot: Record<string, string> = {
  모집중: "bg-green-500", 모집예정: "bg-blue-400", 모집완료: "bg-gray-300",
};
const recruitBadge: Record<string, string> = {
  모집중: "text-green-700 bg-green-50 border-green-200",
  모집예정: "text-blue-700 bg-blue-50 border-blue-200",
  모집완료: "text-gray-500 bg-gray-50 border-gray-200",
};

interface PinGroup {
  name: string;
  recruitStatus: string;
  type: string;
  subType: string;
  date: string;
  pins: MapPin[];
}

export function MapPageClient({ pins }: { pins: MapPin[] }) {
  const [search, setSearch] = useState("");
  const [recruitFilter, setRecruitFilter] = useState<string>("모집중");
  const [typeFilter, setTypeFilter] = useState<string>("전체");
  const [supplyFilter, setSupplyFilter] = useState<string>("전체");
  const [regionFilter, setRegionFilter] = useState<string>("전체");
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const mapHandleRef = useRef<KakaoMapHandle>(null);
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());

  const counts = useMemo(() => {
    const c: Record<string, number> = { 전체: pins.length, 모집중: 0, 모집예정: 0, 모집완료: 0 };
    pins.forEach((p) => { c[p.recruitStatus || "모집완료"]++; });
    return c;
  }, [pins]);

  const availableSupplyTypes = useMemo(() => {
    const m = new Map<string, number>();
    pins.forEach((p) => { if (p.subType) m.set(p.subType, (m.get(p.subType) || 0) + 1); });
    return SUPPLY_TYPES.filter((t) => m.has(t)).map((t) => ({ name: t, count: m.get(t)! }));
  }, [pins]);

  const filtered = useMemo(() => {
    return pins.filter((p) => {
      if (search) {
        const q = search.toLowerCase();
        if (![p.title, p.address, p.complexName, p.region, p.subType].some((f) => f?.toLowerCase().includes(q))) return false;
      }
      if (recruitFilter !== "전체" && p.recruitStatus !== recruitFilter) return false;
      if (typeFilter !== "전체" && p.type !== typeFilter) return false;
      if (supplyFilter !== "전체" && p.subType !== supplyFilter) return false;
      if (regionFilter !== "전체" && p.brtcNm !== regionFilter) return false;
      return true;
    });
  }, [pins, search, recruitFilter, typeFilter, supplyFilter, regionFilter]);

  // 공고명으로 그룹핑
  const groups = useMemo(() => {
    const map = new Map<string, MapPin[]>();
    filtered.forEach((p) => {
      const key = p.title;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });
    const result: PinGroup[] = [];
    map.forEach((pins, name) => {
      result.push({
        name,
        recruitStatus: pins[0].recruitStatus || "모집완료",
        type: pins[0].type || "",
        subType: pins[0].subType || "",
        date: pins[0].date || "",
        pins,
      });
    });
    return result;
  }, [filtered]);

  useEffect(() => {
    if (!selectedPin) return;
    const el = itemRefs.current.get(selectedPin.id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [selectedPin]);

  const handleSelectPin = useCallback((pin: MapPin) => {
    setSelectedPin(pin);
    setPanelOpen(true);
    setTimeout(() => mapHandleRef.current?.flyToPin(pin), 50);
  }, []);

  const handleMapPinClick = useCallback((pin: MapPin) => {
    setSelectedPin(pin);
    setPanelOpen(true);
    // 해당 그룹 자동 펼침
    setExpandedGroup(pin.title);
  }, []);

  const handleMyLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => mapHandleRef.current?.flyToPin({ id: "_loc", lat: pos.coords.latitude, lng: pos.coords.longitude, title: "" }),
      () => alert("위치 정보를 가져올 수 없습니다."),
      { enableHighAccuracy: true }
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSearch(""); setRecruitFilter("모집중"); setTypeFilter("전체");
    setSupplyFilter("전체"); setRegionFilter("전체");
  }, []);

  const hasCustomFilters = search || typeFilter !== "전체" || supplyFilter !== "전체" || regionFilter !== "전체";

  return (
    <div className="relative w-full h-dvh overflow-hidden">
      <KakaoMap ref={mapHandleRef} pins={filtered} className="absolute inset-0 w-full h-full" onPinClick={handleMapPinClick} />

      {/* 사이드 패널 */}
      <div className={`absolute top-0 left-0 z-20 h-full transition-transform duration-300 w-[85vw] max-w-[380px] ${panelOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="h-full bg-white shadow-2xl flex flex-col">
          {/* 헤더 */}
          <div className="px-4 pt-4 pb-3 border-b border-gray-100 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-lg font-bold text-gray-900">청약하우스</h1>
              <button onClick={() => setPanelOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">✕</button>
            </div>

            <div className="relative">
              <input type="text" placeholder="공고명, 단지명, 주소 검색" value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              <svg className="absolute left-3 top-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {search && <button onClick={() => setSearch("")} className="absolute right-3 top-3 text-gray-400 text-xs">✕</button>}
            </div>

            {/* 모집상태 탭 */}
            <div className="flex mt-3 bg-gray-100 rounded-lg p-0.5">
              {RECRUIT_OPTIONS.map((r) => (
                <button key={r} onClick={() => setRecruitFilter(r)}
                  className={`flex-1 py-1.5 text-[11px] rounded-md font-medium transition-all ${recruitFilter === r ? "bg-white shadow-sm text-gray-900" : "text-gray-500"}`}
                >{r} <span className="text-[10px] opacity-60">{counts[r]}</span></button>
              ))}
            </div>

            <div className="flex gap-1.5 mt-2">
              {(["전체", "공공임대", "공공분양"] as const).map((t) => (
                <button key={t} onClick={() => setTypeFilter(t)}
                  className={`flex-1 py-1.5 text-[11px] rounded-lg font-medium transition-colors ${typeFilter === t ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"}`}
                >{t}</button>
              ))}
              <button onClick={() => setShowMoreFilters(!showMoreFilters)}
                className={`px-3 py-1.5 text-[11px] rounded-lg font-medium border transition-colors ${showMoreFilters || hasCustomFilters ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200"}`}
              >필터{hasCustomFilters ? " ●" : ""}</button>
            </div>

            {showMoreFilters && (
              <div className="mt-2 pt-2 border-t border-gray-100 space-y-2">
                <div>
                  <p className="text-[10px] text-gray-400 mb-1">지역</p>
                  <div className="flex flex-wrap gap-1">
                    <button onClick={() => setRegionFilter("전체")} className={`px-2 py-0.5 text-[10px] rounded-full ${regionFilter === "전체" ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-500"}`}>전체</button>
                    {REGIONS.map((r) => (
                      <button key={r} onClick={() => setRegionFilter(regionFilter === r ? "전체" : r)}
                        className={`px-2 py-0.5 text-[10px] rounded-full ${regionFilter === r ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                      >{shortRegion(r)}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 mb-1">공급유형</p>
                  <div className="flex flex-wrap gap-1">
                    <button onClick={() => setSupplyFilter("전체")} className={`px-2 py-0.5 text-[10px] rounded-full ${supplyFilter === "전체" ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-500"}`}>전체</button>
                    {availableSupplyTypes.map(({ name, count }) => (
                      <button key={name} onClick={() => setSupplyFilter(supplyFilter === name ? "전체" : name)}
                        className={`px-2 py-0.5 text-[10px] rounded-full ${supplyFilter === name ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                      >{name} ({count})</button>
                    ))}
                  </div>
                </div>
                {hasCustomFilters && <button onClick={clearFilters} className="text-[10px] text-red-400">필터 초기화</button>}
              </div>
            )}
          </div>

          {/* 결과 */}
          <div className="px-4 py-1.5 text-[11px] text-gray-400 border-b border-gray-50 bg-gray-50/50 shrink-0">
            공고 {groups.length}건 · 단지 {filtered.length}개
          </div>

          {/* 그룹 리스트 */}
          <div className="flex-1 overflow-y-auto">
            {groups.map((group) => {
              const isMulti = group.pins.length > 1;
              const isExpanded = expandedGroup === group.name;
              const isSingleSelected = !isMulti && selectedPin?.id === group.pins[0].id;

              return (
                <div key={group.name} ref={(el) => { if (el && group.pins.some(p => p.id === selectedPin?.id)) itemRefs.current.set(selectedPin!.id, el); }}>
                  {/* 그룹 헤더 */}
                  <button
                    onClick={() => {
                      if (isMulti) {
                        setExpandedGroup(isExpanded ? null : group.name);
                      } else {
                        handleSelectPin(group.pins[0]);
                      }
                    }}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 transition-all ${
                      isSingleSelected ? "bg-blue-50 border-l-[3px] border-l-blue-500" :
                      isExpanded ? "bg-gray-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${recruitDot[group.recruitStatus]}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`text-[10px] px-1.5 py-0 rounded border font-medium ${recruitBadge[group.recruitStatus]}`}>
                            {group.recruitStatus}
                          </span>
                          <span className="text-[10px] text-gray-400">{group.subType || group.type}</span>
                        </div>
                        <p className="text-[13px] font-semibold text-gray-900 leading-snug line-clamp-2">{group.name}</p>
                        {!isMulti && group.pins[0].complexName && (
                          <p className="text-[11px] text-gray-500 mt-0.5">{group.pins[0].complexName}</p>
                        )}
                        {!isMulti && group.pins[0].extra && (
                          <p className="text-[11px] text-blue-600 mt-0.5 font-medium">{group.pins[0].extra}</p>
                        )}
                        <p className="text-[10px] text-gray-400 mt-0.5">모집 {group.date}</p>
                      </div>
                      {isMulti && (
                        <div className="shrink-0 flex items-center gap-1">
                          <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
                            {group.pins.length}단지
                          </span>
                          <svg className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>

                  {/* 펼쳐진 단지 목록 */}
                  {isMulti && isExpanded && (
                    <div className="bg-gray-50/50">
                      {group.pins.map((pin) => (
                        <button
                          key={pin.id}
                          ref={(el) => { if (el) itemRefs.current.set(pin.id, el); }}
                          onClick={() => handleSelectPin(pin)}
                          className={`w-full text-left pl-9 pr-4 py-2.5 border-b border-gray-100 transition-all ${
                            selectedPin?.id === pin.id ? "bg-blue-50 border-l-[3px] border-l-blue-500" : "hover:bg-blue-50/50"
                          }`}
                        >
                          <p className="text-[12px] font-medium text-gray-800">{pin.complexName || pin.address}</p>
                          <p className="text-[11px] text-gray-400 truncate">📍 {pin.address}</p>
                          {pin.extra && <p className="text-[11px] text-blue-600 font-medium">{pin.extra}</p>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {groups.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 text-sm text-gray-400">
                <p>조건에 맞는 공고가 없습니다</p>
                <button onClick={clearFilters} className="mt-2 text-blue-500 text-xs">필터 초기화</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 패널 열기 */}
      {!panelOpen && (
        <button onClick={() => setPanelOpen(true)} className="absolute top-4 left-4 z-10 bg-white shadow-lg rounded-xl px-4 py-2.5 flex items-center gap-2 hover:bg-gray-50">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          <span className="text-sm font-medium">목록</span>
          <span className="text-xs text-white bg-blue-500 rounded-full px-2 py-0.5">{filtered.length}</span>
        </button>
      )}

      {/* 현재위치 */}
      <button onClick={handleMyLocation}
        className="absolute z-10 bg-white shadow-lg rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-50 bottom-6"
        style={{ left: panelOpen ? "min(calc(85vw + 16px), 396px)" : "16px" }}
        title="내 위치"
      >
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3" strokeWidth={2} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v4m0 12v4m10-10h-4M6 12H2" />
        </svg>
      </button>

      {/* 디테일 패널 */}
      <DetailPanel pin={selectedPin} onClose={() => setSelectedPin(null)} />
    </div>
  );
}
