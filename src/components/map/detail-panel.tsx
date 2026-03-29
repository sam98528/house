"use client";

import { useEffect, useState } from "react";
import { type MapPin } from "./kakao-map";

interface DetailPanelProps {
  pin: MapPin | null;
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

export function DetailPanel({ pin, onClose }: DetailPanelProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pin) requestAnimationFrame(() => setVisible(true));
    else setVisible(false);
  }, [pin]);

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
      <div className="bg-white md:rounded-2xl shadow-2xl border border-gray-200/80 overflow-hidden flex flex-col max-h-[65vh] md:max-h-[75vh]">
        {/* 모바일 핸들 */}
        <div className="flex justify-center pt-2 pb-0.5 md:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* 헤더 */}
        <div className="px-5 pt-3 pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                <span className={`text-[10px] text-white px-2 py-0.5 rounded-full font-medium ${
                  isSale ? "bg-emerald-500" : "bg-blue-500"
                }`}>
                  {pin.type}
                </span>
                {pin.subType && (
                  <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {pin.subType}
                  </span>
                )}
                {pin.recruitStatus && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    pin.recruitStatus === "모집중" ? "text-green-700 bg-green-50" :
                    pin.recruitStatus === "모집예정" ? "text-blue-600 bg-blue-50" :
                    "text-gray-500 bg-gray-100"
                  }`}>
                    {pin.recruitStatus}
                  </span>
                )}
                {pin.status === "정정공고" && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full text-orange-600 bg-orange-50">정정</span>
                )}
              </div>
              <h2 className="text-[15px] font-bold text-gray-900 leading-snug">{pin.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto">
          {/* 금액 카드 */}
          {(pin.rentDeposit || pin.monthlyRent) && (
            <div className="mx-5 mb-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
              <p className="text-[10px] text-blue-500 font-semibold mb-2 tracking-wide">임대 조건</p>
              <div className="flex items-end justify-between">
                {pin.rentDeposit && (
                  <div>
                    <p className="text-[10px] text-gray-400">보증금</p>
                    <p className="text-xl font-bold text-gray-900">{pin.rentDeposit}</p>
                  </div>
                )}
                {pin.monthlyRent && (
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400">월임대료</p>
                    <p className="text-xl font-bold text-blue-600">{pin.monthlyRent}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {pin.supplyCount && !pin.rentDeposit && (
            <div className="mx-5 mb-3 bg-emerald-50 rounded-xl p-4">
              <p className="text-[10px] text-emerald-600 font-semibold mb-1">공급 정보</p>
              <p className="text-xl font-bold text-gray-900">{pin.supplyCount}호 공급</p>
            </div>
          )}

          {/* 상세 정보 */}
          <div className="px-5 pb-4 space-y-3">
            <InfoItem icon="🏢" label="단지명" value={pin.complexName} />
            <InfoItem icon="📍" label="주소" value={pin.address} />
            <InfoItem icon="🗺️" label="지역" value={pin.region} />

            <div className="border-t border-gray-100 pt-3" />

            <InfoItem icon="🏠" label="주택유형" value={pin.houseType} />
            <InfoItem icon="📦" label="공급유형" value={pin.subType} />
            {pin.supplyCount && pin.rentDeposit && (
              <InfoItem icon="🔢" label="공급호수" value={`${pin.supplyCount}호`} />
            )}
            <InfoItem icon="🏗️" label="공급기관" value={pin.supplyOrg} />
            <InfoItem icon="🔥" label="난방방식" value={pin.heatMethod} />

            <div className="border-t border-gray-100 pt-3" />

            <InfoItem icon="📅" label="모집기간" value={pin.date} />
            <InfoItem icon="📢" label="모집공고일" value={pin.announceDe} />
            <InfoItem icon="🎯" label="당첨자 발표일" value={pin.winnerDe} />
          </div>
        </div>

        {/* 하단 버튼 */}
        {pin.url && (
          <div className="px-5 pb-5 pt-2 border-t border-gray-100 bg-white">
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
