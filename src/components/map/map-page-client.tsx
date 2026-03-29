"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { KakaoMap, type MapPin, type KakaoMapHandle } from "./kakao-map";
import { DetailPanel } from "./detail-panel";

const RECRUIT_OPTIONS = ["전체", "접수중", "접수예정"] as const;
const SUPPLY_TYPES = ["국민임대","매입임대","영구임대","전세임대","행복주택","10년임대","50년임대","공공지원민간임대주택","공공분양","공공임대"];
const shortRegion = (r: string) => r.replace(/특별자치도|특별자치시|광역시|특별시/g, "").replace(/도$/, "");

const recruitDot: Record<string, string> = { 접수중: "bg-green-500", 접수예정: "bg-blue-400", 접수완료: "bg-gray-300" };
const recruitBadge: Record<string, string> = {
  접수중: "text-green-700 bg-green-50 border-green-200",
  접수예정: "text-blue-700 bg-blue-50 border-blue-200",
  접수완료: "text-gray-500 bg-gray-50 border-gray-200",
};

// 시도 좌표 (지역 클릭 시 지도 이동)
const REGION_CENTER: Record<string, { lat: number; lng: number; level: number }> = {
  서울특별시: { lat: 37.5665, lng: 126.978, level: 9 },
  경기도: { lat: 37.275, lng: 127.0095, level: 10 },
  인천광역시: { lat: 37.4563, lng: 126.7052, level: 9 },
  부산광역시: { lat: 35.1796, lng: 129.0756, level: 9 },
  대구광역시: { lat: 35.8714, lng: 128.6014, level: 9 },
  광주광역시: { lat: 35.1595, lng: 126.8526, level: 9 },
  대전광역시: { lat: 36.3504, lng: 127.3845, level: 9 },
  울산광역시: { lat: 35.5384, lng: 129.3114, level: 9 },
  세종특별자치시: { lat: 36.48, lng: 127.2589, level: 9 },
  강원특별자치도: { lat: 37.8228, lng: 128.1555, level: 11 },
  충청북도: { lat: 36.6357, lng: 127.4912, level: 10 },
  충청남도: { lat: 36.6588, lng: 126.6728, level: 10 },
  전북특별자치도: { lat: 35.8203, lng: 127.1088, level: 10 },
  전라남도: { lat: 34.8161, lng: 126.4629, level: 10 },
  경상북도: { lat: 36.576, lng: 128.5056, level: 10 },
  경상남도: { lat: 35.4606, lng: 128.2132, level: 10 },
  제주특별자치도: { lat: 33.489, lng: 126.4983, level: 10 },
};

interface RegionGroup {
  name: string;
  total: number;
  recruiting: number;
  announcements: AnnouncementGroup[];
}

interface AnnouncementGroup {
  name: string;
  recruitStatus: string;
  type: string;
  subType: string;
  date: string;
  pins: MapPin[];
}

export function MapPageClient({ pins }: { pins: MapPin[] }) {
  const [search, setSearch] = useState("");
  const [recruitFilter, setRecruitFilter] = useState<string>("전체");
  const [typeFilter, setTypeFilter] = useState<string>("전체");
  const [supplyFilter, setSupplyFilter] = useState<string>("전체");
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null);
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);
  const [expandedAnnouncement, setExpandedAnnouncement] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const mapHandleRef = useRef<KakaoMapHandle>(null);
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());

  const counts = useMemo(() => {
    const c: Record<string, number> = { 전체: pins.length, 접수중: 0, 접수예정: 0 };
    pins.forEach((p) => { if (p.recruitStatus === "접수중") c["접수중"]++; else c["접수예정"]++; });
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
      return true;
    });
  }, [pins, search, recruitFilter, typeFilter, supplyFilter]);

  // 지역 → 공고 → 단지 3단계 그룹핑
  const regionGroups = useMemo(() => {
    const regionMap = new Map<string, Map<string, MapPin[]>>();
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");

    filtered.forEach((p) => {
      const region = p.brtcNm || "기타";
      if (!regionMap.has(region)) regionMap.set(region, new Map());
      const announcements = regionMap.get(region)!;
      if (!announcements.has(p.title)) announcements.set(p.title, []);
      announcements.get(p.title)!.push(p);
    });

    const result: RegionGroup[] = [];
    regionMap.forEach((announcements, regionName) => {
      let total = 0;
      let recruiting = 0;
      const annGroups: AnnouncementGroup[] = [];

      announcements.forEach((pins, annName) => {
        total += pins.length;
        const isRecruiting = pins.some(p => p.recruitStatus === "접수중");
        if (isRecruiting) recruiting += pins.length;

        annGroups.push({
          name: annName,
          recruitStatus: pins[0].recruitStatus || "접수완료",
          type: pins[0].type || "",
          subType: pins[0].subType || "",
          date: pins[0].date || "",
          pins,
        });
      });

      result.push({ name: regionName, total, recruiting, announcements: annGroups });
    });

    return result.sort((a, b) => b.total - a.total);
  }, [filtered]);

  useEffect(() => {
    if (!selectedPin) return;
    const el = itemRefs.current.get(selectedPin.id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [selectedPin]);

  const handleSelectPin = useCallback((pin: MapPin) => {
    setSelectedPin(pin);
    setPanelOpen(true);
    mapHandleRef.current?.clearRegionBorder();
    mapHandleRef.current?.highlightPin(pin.id);
    setTimeout(() => mapHandleRef.current?.flyToPin(pin), 50);
  }, []);

  const handleMapPinClick = useCallback((pin: MapPin) => {
    setSelectedPin(pin);
    setPanelOpen(true);
    setExpandedRegion(pin.brtcNm || null);
    setExpandedAnnouncement(pin.title);
    mapHandleRef.current?.highlightPin(pin.id);
  }, []);

  const handleRegionClick = useCallback((regionName: string) => {
    const isExpanding = expandedRegion !== regionName;
    setExpandedRegion(isExpanding ? regionName : null);
    if (isExpanding) {
      setExpandedAnnouncement(null);
      // 폴리곤 경계 표시 + 지도 이동
      mapHandleRef.current?.showRegionBorder(regionName);
    } else {
      mapHandleRef.current?.clearRegionBorder();
    }
  }, [expandedRegion]);

  const handleMyLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => mapHandleRef.current?.flyToPin({ id: "_loc", lat: pos.coords.latitude, lng: pos.coords.longitude, title: "" }),
      () => alert("위치 정보를 가져올 수 없습니다."),
      { enableHighAccuracy: true }
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSearch(""); setRecruitFilter("전체"); setTypeFilter("전체"); setSupplyFilter("전체");
  }, []);

  const hasCustomFilters = search || typeFilter !== "전체" || supplyFilter !== "전체";

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
                className={`px-3 py-1.5 text-[11px] rounded-lg font-medium border ${showMoreFilters || hasCustomFilters ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200"}`}
              >필터{hasCustomFilters ? " ●" : ""}</button>
            </div>

            {showMoreFilters && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <p className="text-[10px] text-gray-400 mb-1">공급유형</p>
                <div className="flex flex-wrap gap-1">
                  <button onClick={() => setSupplyFilter("전체")} className={`px-2 py-0.5 text-[10px] rounded-full ${supplyFilter === "전체" ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-500"}`}>전체</button>
                  {availableSupplyTypes.map(({ name, count }) => (
                    <button key={name} onClick={() => setSupplyFilter(supplyFilter === name ? "전체" : name)}
                      className={`px-2 py-0.5 text-[10px] rounded-full ${supplyFilter === name ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                    >{name} ({count})</button>
                  ))}
                </div>
                {hasCustomFilters && <button onClick={clearFilters} className="text-[10px] text-red-400 mt-1">필터 초기화</button>}
              </div>
            )}
          </div>

          <div className="px-4 py-1.5 text-[11px] text-gray-400 border-b border-gray-50 bg-gray-50/50 shrink-0">
            {regionGroups.length}개 지역 · {filtered.length}건
          </div>

          {/* 지역별 리스트 */}
          <div className="flex-1 overflow-y-auto">
            {regionGroups.map((region) => {
              const isRegionExpanded = expandedRegion === region.name;

              return (
                <div key={region.name}>
                  {/* 지역 헤더 */}
                  <button
                    onClick={() => handleRegionClick(region.name)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-100 transition-all ${
                      isRegionExpanded ? "bg-blue-50/50 sticky top-0 z-10" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[15px] font-bold text-gray-900">{region.name}</span>
                      <div className="flex items-center gap-2">
                        {region.recruiting > 0 && (
                          <span className="text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                            접수중 {region.recruiting}
                          </span>
                        )}
                        <span className="text-[11px] text-gray-400">{region.total}건</span>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isRegionExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </button>

                  {/* 지역 내 공고 목록 */}
                  {isRegionExpanded && region.announcements.map((ann) => {
                    const isMulti = ann.pins.length > 1;
                    const isAnnExpanded = expandedAnnouncement === ann.name;

                    return (
                      <div key={ann.name} className="bg-gray-50/30">
                        {/* 공고 헤더 */}
                        <button
                          onClick={() => {
                            if (isMulti) {
                              setExpandedAnnouncement(isAnnExpanded ? null : ann.name);
                            } else {
                              handleSelectPin(ann.pins[0]);
                            }
                          }}
                          className={`w-full text-left pl-8 pr-4 py-2.5 border-b border-gray-100 transition-all ${
                            !isMulti && selectedPin?.id === ann.pins[0].id ? "bg-blue-50 border-l-[3px] border-l-blue-500" :
                            isAnnExpanded ? "bg-white" : "hover:bg-white"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${recruitDot[ann.recruitStatus]}`} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className={`text-[9px] px-1.5 rounded border font-medium ${recruitBadge[ann.recruitStatus]}`}>{ann.recruitStatus}</span>
                                <span className="text-[10px] text-gray-400">{ann.subType || ann.type}</span>
                              </div>
                              <p className="text-[12px] font-semibold text-gray-800 leading-snug line-clamp-2">{ann.name}</p>
                              {!isMulti && ann.pins[0].extra && (
                                <p className="text-[11px] text-blue-600 mt-0.5 font-medium">{ann.pins[0].extra}</p>
                              )}
                              <p className="text-[10px] text-gray-400 mt-0.5">접수{ann.date}</p>
                            </div>
                            {isMulti && (
                              <div className="shrink-0 flex items-center gap-1 mt-1">
                                <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full font-medium">{ann.pins.length}단지</span>
                                <svg className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isAnnExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </button>

                        {/* 단지 목록 */}
                        {isMulti && isAnnExpanded && ann.pins.map((pin) => (
                          <button
                            key={pin.id}
                            ref={(el) => { if (el) itemRefs.current.set(pin.id, el); }}
                            onClick={() => handleSelectPin(pin)}
                            className={`w-full text-left pl-14 pr-4 py-2 border-b border-gray-100 transition-all ${
                              selectedPin?.id === pin.id ? "bg-blue-50 border-l-[3px] border-l-blue-500" : "hover:bg-blue-50/50"
                            }`}
                          >
                            <p className="text-[12px] font-medium text-gray-700">{pin.complexName || "단지"}</p>
                            <p className="text-[10px] text-gray-400 truncate">{pin.address || "📍 전국"}</p>
                            {pin.extra && <p className="text-[10px] text-blue-600 font-medium">{pin.extra}</p>}
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {regionGroups.length === 0 && (
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
        style={{ left: panelOpen ? "min(calc(85vw + 16px), 396px)" : "16px" }} title="내 위치"
      >
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3" strokeWidth={2} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v4m0 12v4m10-10h-4M6 12H2" />
        </svg>
      </button>

      <DetailPanel
        pin={selectedPin}
        regionPins={filtered.filter(p => selectedPin && p.brtcNm === selectedPin.brtcNm)}
        onSelect={handleSelectPin}
        onClose={() => { setSelectedPin(null); mapHandleRef.current?.highlightPin(null); }}
      />
    </div>
  );
}
