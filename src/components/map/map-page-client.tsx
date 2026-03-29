"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { KakaoMap, type MapPin, type KakaoMapHandle } from "./kakao-map";
import { DetailPanel } from "./detail-panel";

const SUPPLY_TYPES = [
  "국민임대", "매입임대", "영구임대", "전세임대", "행복주택",
  "10년임대", "50년임대", "공공지원민간임대주택",
];

export function MapPageClient({ pins }: { pins: MapPin[] }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"전체" | "공공임대" | "공공분양">("전체");
  const [supplyFilter, setSupplyFilter] = useState<string>("전체");
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const mapHandleRef = useRef<KakaoMapHandle>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // 실제 데이터에 있는 공급유형만 필터에 표시
  const availableSupplyTypes = useMemo(() => {
    const types = new Set<string>();
    pins.forEach((p) => { if (p.subType) types.add(p.subType); });
    return SUPPLY_TYPES.filter((t) => types.has(t));
  }, [pins]);

  const filtered = useMemo(() => {
    return pins.filter((p) => {
      if (search) {
        const q = search.toLowerCase();
        const fields = [p.title, p.address, p.complexName, p.region, p.subType].filter(Boolean);
        if (!fields.some((f) => f!.toLowerCase().includes(q))) return false;
      }
      if (typeFilter !== "전체" && p.type !== typeFilter) return false;
      if (supplyFilter !== "전체" && p.subType !== supplyFilter) return false;
      return true;
    });
  }, [pins, search, typeFilter, supplyFilter]);

  // 핀 선택 시 왼쪽 패널 스크롤
  useEffect(() => {
    if (!selectedPin) return;
    const el = itemRefs.current.get(selectedPin.id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedPin]);

  const handleSelectPin = useCallback((pin: MapPin) => {
    setSelectedPin(pin);
    setPanelOpen(true);
    setTimeout(() => mapHandleRef.current?.flyToPin(pin), 50);
  }, []);

  // 지도에서 핀 클릭 시
  const handleMapPinClick = useCallback((pin: MapPin) => {
    setSelectedPin(pin);
    setPanelOpen(true);
  }, []);

  const handleMyLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mapHandleRef.current?.flyToPin({
          id: "_loc", lat: pos.coords.latitude, lng: pos.coords.longitude, title: "",
        });
      },
      () => alert("위치 정보를 가져올 수 없습니다."),
      { enableHighAccuracy: true }
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSearch("");
    setTypeFilter("전체");
    setSupplyFilter("전체");
  }, []);

  const hasFilters = search || typeFilter !== "전체" || supplyFilter !== "전체";

  return (
    <div className="relative w-full h-dvh overflow-hidden">
      {/* 지도 */}
      <KakaoMap
        ref={mapHandleRef}
        pins={filtered}
        className="absolute inset-0 w-full h-full"
        onPinClick={handleMapPinClick}
      />

      {/* 왼쪽 사이드 패널 */}
      <div
        className={`
          absolute top-0 left-0 z-20 h-full
          transition-transform duration-300 ease-in-out
          w-[85vw] max-w-[380px]
          ${panelOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="h-full bg-white shadow-2xl flex flex-col">
          {/* 헤더 */}
          <div className="px-4 pt-4 pb-3 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className="text-lg font-bold text-gray-900">청약하우스</h1>
                <p className="text-[11px] text-gray-400 mt-0.5">공공주택 모집공고 {pins.length}건</p>
              </div>
              <button
                onClick={() => setPanelOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400"
              >
                ✕
              </button>
            </div>

            {/* 검색 */}
            <div className="relative">
              <input
                type="text"
                placeholder="공고명, 단지명, 주소, 지역 검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 text-xs">✕</button>
              )}
            </div>

            {/* 임대/분양 토글 */}
            <div className="flex gap-1.5 mt-3">
              {(["전체", "공공임대", "공공분양"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`flex-1 py-1.5 text-xs rounded-lg transition-colors font-medium ${
                    typeFilter === t ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {t === "전체" ? `전체 (${filtered.length})` : t}
                </button>
              ))}
            </div>

            {/* 공급유형 필터 */}
            <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1 -mx-4 px-4">
              <button
                onClick={() => setSupplyFilter("전체")}
                className={`px-2.5 py-1 text-[11px] rounded-full whitespace-nowrap transition-colors ${
                  supplyFilter === "전체" ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                전체 유형
              </button>
              {availableSupplyTypes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSupplyFilter(supplyFilter === s ? "전체" : s)}
                  className={`px-2.5 py-1 text-[11px] rounded-full whitespace-nowrap transition-colors ${
                    supplyFilter === s ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* 활성 필터 표시 */}
            {hasFilters && (
              <div className="flex items-center justify-between mt-2">
                <span className="text-[11px] text-gray-400">
                  {filtered.length}건 표시 중
                </span>
                <button onClick={clearFilters} className="text-[11px] text-red-400 hover:text-red-600">
                  필터 초기화
                </button>
              </div>
            )}
          </div>

          {/* 리스트 */}
          <div ref={listRef} className="flex-1 overflow-y-auto">
            {filtered.map((pin) => (
              <button
                key={pin.id}
                ref={(el) => { if (el) itemRefs.current.set(pin.id, el); }}
                onClick={() => handleSelectPin(pin)}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 transition-all ${
                  selectedPin?.id === pin.id
                    ? "bg-blue-50 border-l-[3px] border-l-blue-500"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-1 shrink-0">
                    <span className="text-base">{pin.type === "공공분양" ? "🏠" : "🏢"}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-gray-900 leading-snug line-clamp-2">{pin.title}</p>
                    {pin.complexName && (
                      <p className="text-[11px] text-gray-600 mt-0.5">{pin.complexName}</p>
                    )}
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">📍 {pin.address}</p>
                    {pin.extra && <p className="text-[11px] text-blue-600 mt-0.5 font-medium">{pin.extra}</p>}
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{pin.subType || pin.type}</span>
                      <span className="text-[10px] text-gray-400">{pin.date}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 text-sm text-gray-400">
                <p>조건에 맞는 공고가 없습니다</p>
                {hasFilters && (
                  <button onClick={clearFilters} className="mt-2 text-blue-500 text-xs">필터 초기화</button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 패널 열기 버튼 */}
      {!panelOpen && (
        <button
          onClick={() => setPanelOpen(true)}
          className="absolute top-4 left-4 z-10 bg-white shadow-lg rounded-xl px-4 py-2.5 flex items-center gap-2 hover:bg-gray-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="text-sm font-medium">목록</span>
          <span className="text-xs text-white bg-blue-500 rounded-full px-2 py-0.5">{filtered.length}</span>
        </button>
      )}

      {/* 현재위치 — 왼쪽 하단 (패널 아래) */}
      <button
        onClick={handleMyLocation}
        className={`absolute z-10 bg-white shadow-lg rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-all bottom-6 ${
          panelOpen ? "left-[calc(85vw+16px)] max-[380px]:left-[396px]" : "left-4"
        }`}
        style={panelOpen ? { left: "min(calc(85vw + 16px), 396px)" } : undefined}
        title="내 위치"
      >
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3" strokeWidth={2} />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v4m0 12v4m10-10h-4M6 12H2" />
        </svg>
      </button>

      {/* 우하단 상세 패널 */}
      <DetailPanel pin={selectedPin} onClose={() => setSelectedPin(null)} />
    </div>
  );
}
