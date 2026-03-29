"use client";

import { useEffect, useState } from "react";
import { type MapPin } from "./kakao-map";

interface DetailPanelProps {
  pin: MapPin | null;
  onClose: () => void;
}

export function DetailPanel({ pin, onClose }: DetailPanelProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pin) {
      // 약간 딜레이 후 슬라이드 인
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [pin]);

  if (!pin) return null;

  const statusColor: Record<string, string> = {
    일반공고: "bg-blue-500",
    정정공고: "bg-orange-500",
  };

  const InfoRow = ({ icon, label, value }: { icon: string; label: string; value?: string | number | null }) => {
    if (!value) return null;
    return (
      <div className="flex items-start gap-3 py-2">
        <span className="text-base shrink-0 mt-0.5">{icon}</span>
        <div className="min-w-0">
          <p className="text-[11px] text-gray-400 leading-none mb-0.5">{label}</p>
          <p className="text-[13px] text-gray-800 leading-snug">{value}</p>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`
        fixed md:absolute bottom-0 right-0 z-30
        w-full md:w-[400px] md:bottom-5 md:right-5 md:max-h-[calc(100vh-40px)]
        transition-all duration-300 ease-out
        ${visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"}
      `}
    >
      <div className="bg-white md:rounded-2xl shadow-2xl border border-gray-200/80 overflow-hidden flex flex-col max-h-[70vh] md:max-h-[80vh]">
        {/* 모바일 드래그 핸들 */}
        <div className="flex justify-center pt-2 pb-1 md:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* 헤더 — 공고명 + 상태 */}
        <div className="px-5 pt-3 pb-3 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[10px] text-white px-2 py-0.5 rounded-full font-medium ${statusColor[pin.status || ""] || "bg-gray-500"}`}>
                  {pin.status}
                </span>
                <span className="text-[11px] text-gray-500">
                  {pin.type}
                </span>
              </div>
              <h2 className="text-[15px] font-bold text-gray-900 leading-snug">
                {pin.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 스크롤 가능한 정보 영역 */}
        <div className="flex-1 overflow-y-auto px-5 py-3 divide-y divide-gray-100">
          {/* 위치 정보 */}
          <div className="pb-3">
            <InfoRow icon="🏢" label="단지명" value={pin.complexName} />
            <InfoRow icon="📍" label="주소" value={pin.address} />
            <InfoRow icon="🗺️" label="지역" value={pin.region} />
          </div>

          {/* 공급 정보 */}
          <div className="py-3">
            <InfoRow icon="🏠" label="주택유형" value={pin.houseType} />
            <InfoRow icon="📦" label="공급유형" value={pin.subType} />
            <InfoRow icon="🔢" label="공급호수" value={pin.supplyCount ? `${pin.supplyCount}호` : undefined} />
            <InfoRow icon="🏗️" label="공급기관" value={pin.supplyOrg} />
            {pin.heatMethod && <InfoRow icon="🔥" label="난방방식" value={pin.heatMethod} />}
          </div>

          {/* 금액 정보 */}
          {(pin.rentDeposit || pin.monthlyRent) && (
            <div className="py-3">
              <div className="bg-blue-50 rounded-xl p-3.5">
                <p className="text-[11px] text-blue-500 font-medium mb-2">임대 조건</p>
                <div className="flex items-center justify-between">
                  {pin.rentDeposit && (
                    <div>
                      <p className="text-[10px] text-gray-400">보증금</p>
                      <p className="text-base font-bold text-gray-900">{pin.rentDeposit}</p>
                    </div>
                  )}
                  {pin.monthlyRent && (
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400">월임대료</p>
                      <p className="text-base font-bold text-blue-700">{pin.monthlyRent}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 일정 정보 */}
          <div className="py-3">
            <InfoRow icon="📅" label="모집기간" value={pin.date} />
            <InfoRow icon="📢" label="모집공고일" value={pin.announceDe} />
            <InfoRow icon="🎯" label="당첨자 발표일" value={pin.winnerDe} />
          </div>
        </div>

        {/* 하단 버튼 */}
        {pin.url && (
          <div className="px-5 pb-5 pt-2 border-t border-gray-100">
            <a
              href={pin.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold text-center rounded-xl transition-colors"
            >
              공고 상세보기 →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
