"use client";

import { useState, useMemo, useCallback } from "react";
import { KakaoMap, type MapPin } from "./kakao-map";

const STATUS_OPTIONS = ["전체", "공고중", "접수중", "접수마감", "정정공고중"];
const TYPE_OPTIONS = ["전체", "임대주택", "분양주택", "공공분양(신혼희망)"];

const statusDot: Record<string, string> = {
  공고중: "bg-blue-500",
  접수중: "bg-green-500",
  접수마감: "bg-gray-400",
  정정공고중: "bg-orange-500",
};

export function MapPageClient({ pins }: { pins: MapPin[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("전체");
  const [typeFilter, setTypeFilter] = useState("전체");
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 36.5, lng: 127.5 });
  const [mapLevel, setMapLevel] = useState(13);

  const filtered = useMemo(() => {
    return pins.filter((p) => {
      if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "전체" && p.status !== statusFilter) return false;
      if (typeFilter !== "전체" && p.type !== typeFilter) return false;
      return true;
    });
  }, [pins, search, statusFilter, typeFilter]);

  const handleListClick = useCallback((pin: MapPin) => {
    setSelectedPin(pin);
    setMapCenter({ lat: pin.lat, lng: pin.lng });
    setMapLevel(5);
  }, []);

  const handleMyLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMapCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setMapLevel(6);
      },
      () => alert("위치 정보를 가져올 수 없습니다."),
      { enableHighAccuracy: true }
    );
  }, []);

  return (
    <div className="flex h-dvh relative overflow-hidden">
      {/* 사이드 패널 */}
      <div
        className={`
          absolute md:relative z-20 h-full transition-transform duration-300 ease-in-out
          w-[340px] md:w-[380px] bg-white border-r flex flex-col
          ${panelOpen ? "translate-x-0" : "-translate-x-full md:-translate-x-full"}
        `}
      >
        {/* 패널 헤더 */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-gray-900">청약하우스</h1>
            <button
              onClick={() => setPanelOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
            >
              ✕
            </button>
          </div>

          {/* 검색 */}
          <div className="relative">
            <input
              type="text"
              placeholder="공고명, 지역 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg className="absolute left-3 top-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* 필터 탭 */}
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
        <div className="px-4 py-2 text-xs text-gray-500 border-b bg-gray-50">
          검색결과 {filtered.length}건
        </div>

        {/* 공고 리스트 */}
        <div className="flex-1 overflow-y-auto">
          {filtered.map((pin) => (
            <button
              key={pin.id}
              onClick={() => handleListClick(pin)}
              className={`w-full text-left px-4 py-3.5 border-b border-gray-100 hover:bg-blue-50 transition-colors ${
                selectedPin?.id === pin.id ? "bg-blue-50 border-l-2 border-l-blue-500" : ""
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
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-gray-400">{pin.region}</span>
                    <span className="text-[11px] text-gray-300">|</span>
                    <span className="text-[11px] text-gray-400">{pin.subType || pin.type}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">{pin.date}</p>
                </div>
                <span
                  className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded ${
                    pin.status === "접수중"
                      ? "bg-green-100 text-green-700"
                      : pin.status === "공고중"
                        ? "bg-blue-100 text-blue-700"
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

      {/* 지도 영역 */}
      <div className="flex-1 relative">
        <KakaoMap
          pins={filtered}
          center={mapCenter}
          level={mapLevel}
          className="w-full h-full"
          onPinClick={(pin) => setSelectedPin(pin)}
        />

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

        {/* 줌 컨트롤 */}
        <div className="absolute bottom-20 right-4 z-10 flex flex-col bg-white shadow-lg rounded-xl overflow-hidden">
          <button
            onClick={() => setMapLevel((l) => Math.max(1, l - 1))}
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 text-lg font-light border-b"
          >
            +
          </button>
          <button
            onClick={() => setMapLevel((l) => Math.min(14, l + 1))}
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 text-lg font-light"
          >
            −
          </button>
        </div>
      </div>
    </div>
  );
}
