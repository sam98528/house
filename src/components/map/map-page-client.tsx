"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { KakaoMap, type MapPin, type KakaoMapHandle } from "./kakao-map";

const STATUS_OPTIONS = ["전체", "일반공고", "정정공고"];
const TYPE_OPTIONS = ["전체", "공공임대", "공공분양"];

const statusDot: Record<string, string> = {
  일반공고: "bg-blue-500",
  정정공고: "bg-orange-500",
};

export function MapPageClient({ pins }: { pins: MapPin[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("전체");
  const [typeFilter, setTypeFilter] = useState("전체");
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number; level: number } | null>(null);
  const mapHandleRef = useRef<KakaoMapHandle>(null);

  const filtered = useMemo(() => {
    return pins.filter((p) => {
      if (search && !p.title.toLowerCase().includes(search.toLowerCase())
        && !(p.address || "").toLowerCase().includes(search.toLowerCase())
        && !(p.complexName || "").toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "전체" && p.status !== statusFilter) return false;
      if (typeFilter !== "전체" && p.type !== typeFilter) return false;
      return true;
    });
  }, [pins, search, statusFilter, typeFilter]);

  const handleListClick = useCallback((pin: MapPin) => {
    setSelectedPin(pin);
    setFlyTo({ lat: pin.lat, lng: pin.lng, level: 4 });
    // 약간의 딜레이 후 오버레이 열기 (지도 이동 완료 후)
    setTimeout(() => {
      mapHandleRef.current?.openPin(pin.id);
    }, 400);
  }, []);

  const handleMyLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFlyTo({ lat: pos.coords.latitude, lng: pos.coords.longitude, level: 6 });
      },
      () => alert("위치 정보를 가져올 수 없습니다."),
      { enableHighAccuracy: true }
    );
  }, []);

  return (
    <div className="relative w-full h-dvh overflow-hidden">
      {/* 지도 — 전체 화면 배경 */}
      <KakaoMap
        ref={mapHandleRef}
        pins={filtered}
        className="absolute inset-0 w-full h-full"
        onPinClick={(pin) => setSelectedPin(pin)}
        flyTo={flyTo}
      />

      {/* 사이드 패널 — 지도 위에 floating */}
      <div
        className={`
          absolute top-0 left-0 z-20 h-full
          transition-transform duration-300 ease-in-out
          w-[340px] md:w-[380px]
          ${panelOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="h-full bg-white/95 backdrop-blur-sm shadow-2xl flex flex-col border-r border-gray-200">
          {/* 헤더 */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-lg font-bold text-gray-900">청약하우스</h1>
              <button
                onClick={() => setPanelOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* 검색 */}
            <div className="relative">
              <input
                type="text"
                placeholder="공고명, 단지명, 주소 검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
              <svg className="absolute left-3 top-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* 필터 */}
            <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors ${
                    statusFilter === s
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
              {TYPE_OPTIONS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors ${
                    typeFilter === t
                      ? "bg-blue-600 text-white"
                      : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* 결과 수 */}
          <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100 bg-gray-50/80">
            검색결과 {filtered.length}건
          </div>

          {/* 공고 리스트 */}
          <div className="flex-1 overflow-y-auto">
            {filtered.map((pin) => (
              <button
                key={pin.id}
                onClick={() => handleListClick(pin)}
                className={`w-full text-left px-4 py-3.5 border-b border-gray-100 hover:bg-blue-50/80 transition-colors ${
                  selectedPin?.id === pin.id ? "bg-blue-50 border-l-[3px] border-l-blue-500" : ""
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${statusDot[pin.status || ""] || "bg-gray-400"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 leading-snug line-clamp-2">
                      {pin.title}
                    </p>
                    {pin.address && (
                      <p className="text-xs text-gray-500 mt-1 truncate">📍 {pin.address}</p>
                    )}
                    {pin.extra && (
                      <p className="text-xs text-blue-600 mt-0.5">💰 {pin.extra}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-gray-400">{pin.subType || pin.type}</span>
                      <span className="text-[11px] text-gray-300">|</span>
                      <span className="text-[11px] text-gray-400">{pin.region}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">{pin.date}</p>
                  </div>
                  <span
                    className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded ${
                      pin.status === "일반공고"
                        ? "bg-blue-100 text-blue-700"
                        : pin.status === "정정공고"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {pin.status}
                  </span>
                </div>
              </button>
            ))}

            {filtered.length === 0 && (
              <div className="flex items-center justify-center h-40 text-sm text-gray-400">
                조건에 맞는 공고가 없습니다
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 패널 열기 버튼 */}
      {!panelOpen && (
        <button
          onClick={() => setPanelOpen(true)}
          className="absolute top-4 left-4 z-10 bg-white shadow-lg rounded-xl px-4 py-2.5 flex items-center gap-2 hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="text-sm font-medium">공고 목록</span>
          <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">{filtered.length}</span>
        </button>
      )}

      {/* 현재 위치 버튼 */}
      <button
        onClick={handleMyLocation}
        className="absolute bottom-6 right-4 z-10 bg-white shadow-lg rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
        title="내 위치"
      >
        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>
  );
}
