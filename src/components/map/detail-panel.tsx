"use client";

import { useEffect, useState, useMemo } from "react";
import { type MapPin } from "./kakao-map";

interface DetailPanelProps {
  pin: MapPin | null;
  regionPins: MapPin[];
  onSelect: (pin: MapPin) => void;
  onClose: () => void;
}

function InfoItem({ icon, label, value }: { icon: string; label: string; value?: string | number | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <span className="text-sm shrink-0 w-5 text-center">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-gray-400 leading-none">{label}</p>
        <p className="text-[13px] text-gray-800 mt-0.5 leading-snug">{String(value)}</p>
      </div>
    </div>
  );
}

export function DetailPanel({ pin, regionPins, onSelect, onClose }: DetailPanelProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pin) requestAnimationFrame(() => setVisible(true));
    else setVisible(false);
  }, [pin]);

  const currentIndex = useMemo(() => {
    if (!pin) return -1;
    return regionPins.findIndex(p => p.id === pin.id);
  }, [pin, regionPins]);

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < regionPins.length - 1;

  const goPrev = () => { if (hasPrev) onSelect(regionPins[currentIndex - 1]); };
  const goNext = () => { if (hasNext) onSelect(regionPins[currentIndex + 1]); };

  if (!pin) return null;

  const isSale = pin.type === "공공분양";

  return (
    <div
      className={`
        fixed md:absolute bottom-0 right-0 z-30
        w-full md:w-[400px] md:bottom-5 md:right-5
        transition-all duration-300 ease-out
        ${visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}
      `}
    >
      <div className="bg-white md:rounded-2xl shadow-2xl border border-gray-200/80 overflow-hidden flex flex-col max-h-[60vh] md:max-h-[70vh]">
        {/* 모바일 핸들 */}
        <div className="flex justify-center pt-2 pb-0.5 md:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* 헤더 + 네비게이션 */}
        <div className="px-5 pt-3 pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                <span className={`text-[10px] text-white px-2 py-0.5 rounded-full font-medium ${isSale ? "bg-emerald-500" : "bg-blue-500"}`}>
                  {pin.type}
                </span>
                {pin.subType && <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{pin.subType}</span>}
                {pin.recruitStatus && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    pin.recruitStatus === "모집중" ? "text-green-700 bg-green-50" :
                    pin.recruitStatus === "모집예정" ? "text-blue-600 bg-blue-50" : "text-gray-500 bg-gray-100"
                  }`}>{pin.recruitStatus}</span>
                )}
                {pin.status === "정정공고" && <span className="text-[10px] px-2 py-0.5 rounded-full text-orange-600 bg-orange-50">정정</span>}
              </div>
              <h2 className="text-[15px] font-bold text-gray-900 leading-snug">{pin.title}</h2>
            </div>
            <button onClick={onClose} className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">✕</button>
          </div>

          {/* 지역 내 이전/다음 — 헤더 안쪽 */}
          {regionPins.length > 1 && (
            <div className="flex items-center gap-2 mt-3">
              <button onClick={goPrev} disabled={!hasPrev}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  hasPrev ? "bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95" : "bg-gray-50 text-gray-300"
                }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                이전
              </button>
              <span className="text-[12px] text-gray-500 font-medium whitespace-nowrap px-2">
                {currentIndex + 1} / {regionPins.length}
              </span>
              <button onClick={goNext} disabled={!hasNext}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  hasNext ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-95" : "bg-gray-50 text-gray-300"
                }`}>
                다음
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          )}
        </div>

        {/* 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto">
          {(pin.rentDeposit || pin.monthlyRent) && (
            <div className="mx-5 mb-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
              <p className="text-[10px] text-blue-500 font-semibold mb-2 tracking-wide">임대 조건</p>
              <div className="flex items-end justify-between">
                {pin.rentDeposit && <div><p className="text-[10px] text-gray-400">보증금</p><p className="text-xl font-bold text-gray-900">{pin.rentDeposit}</p></div>}
                {pin.monthlyRent && <div className="text-right"><p className="text-[10px] text-gray-400">월임대료</p><p className="text-xl font-bold text-blue-600">{pin.monthlyRent}</p></div>}
              </div>
            </div>
          )}

          {pin.supplyCount && !pin.rentDeposit && (
            <div className="mx-5 mb-3 bg-emerald-50 rounded-xl p-4">
              <p className="text-[10px] text-emerald-600 font-semibold mb-1">공급 정보</p>
              <p className="text-xl font-bold text-gray-900">{pin.supplyCount}호 공급</p>
            </div>
          )}

          <div className="px-5 pb-4 space-y-3">
            <InfoItem icon="🏢" label="단지명" value={pin.complexName} />
            <InfoItem icon="📍" label="주소" value={pin.address} />
            <InfoItem icon="🗺️" label="지역" value={pin.region} />
            <div className="border-t border-gray-100 pt-3" />
            <InfoItem icon="🏠" label="주택유형" value={pin.houseType} />
            <InfoItem icon="📦" label="공급유형" value={pin.subType} />
            {pin.supplyCount && pin.rentDeposit && <InfoItem icon="🔢" label="공급호수" value={`${pin.supplyCount}호`} />}
            <InfoItem icon="🏗️" label="공급기관" value={pin.supplyOrg} />
            <InfoItem icon="🔥" label="난방방식" value={pin.heatMethod} />
            <div className="border-t border-gray-100 pt-3" />
            <InfoItem icon="📅" label="모집기간" value={pin.date} />
            <InfoItem icon="📢" label="모집공고일" value={pin.announceDe} />
            <InfoItem icon="🎯" label="당첨자 발표일" value={pin.winnerDe} />
          </div>
        </div>

        {pin.url && (
          <div className="px-5 pb-5 pt-2 border-t border-gray-100 bg-white">
            <a href={pin.url} target="_blank" rel="noopener noreferrer"
              className="block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold text-center rounded-xl transition-colors">
              공고 상세보기 →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
