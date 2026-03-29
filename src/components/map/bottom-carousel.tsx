"use client";

import { useRef, useEffect, useCallback } from "react";
import { type MapPin } from "./kakao-map";

interface BottomCarouselProps {
  pins: MapPin[];
  selectedId: string | null;
  onSelect: (pin: MapPin) => void;
}

const recruitColor: Record<string, string> = {
  모집중: "border-green-400 bg-green-50",
  모집예정: "border-blue-300 bg-blue-50",
  모집완료: "border-gray-200 bg-gray-50",
};

const recruitBadge: Record<string, string> = {
  모집중: "text-green-700 bg-green-100",
  모집예정: "text-blue-600 bg-blue-100",
  모집완료: "text-gray-500 bg-gray-100",
};

export function BottomCarousel({ pins, selectedId, onSelect }: BottomCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // 선택된 카드로 스크롤
  useEffect(() => {
    if (!selectedId) return;
    const el = itemRefs.current.get(selectedId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [selectedId]);

  // 스크롤 멈추면 가운데 있는 카드 자동 선택
  const handleScrollEnd = useCallback(() => {
    const container = scrollRef.current;
    if (!container || pins.length === 0) return;

    const containerRect = container.getBoundingClientRect();
    const centerX = containerRect.left + containerRect.width / 2;

    let closest: { pin: MapPin; dist: number } | null = null as { pin: MapPin; dist: number } | null;
    itemRefs.current.forEach((el, id) => {
      const rect = el.getBoundingClientRect();
      const cardCenter = rect.left + rect.width / 2;
      const dist = Math.abs(cardCenter - centerX);
      const pin = pins.find(p => p.id === id);
      if (pin && (!closest || dist < closest.dist)) {
        closest = { pin, dist };
      }
    });

    if (closest) {
      const c = closest as { pin: MapPin; dist: number };
      if (c.pin.id !== selectedId) {
        onSelect(c.pin);
      }
    }
  }, [pins, selectedId, onSelect]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let timer: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(handleScrollEnd, 150);
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", onScroll);
      clearTimeout(timer);
    };
  }, [handleScrollEnd]);

  if (pins.length === 0) return null;

  return (
    <div
      ref={scrollRef}
      className="absolute bottom-5 left-0 right-0 z-25 flex gap-3 overflow-x-auto px-4 pb-2 snap-x snap-mandatory scroll-smooth"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}
    >
      {/* 왼쪽 여백 */}
      <div className="shrink-0 w-[calc(50vw-150px)]" />

      {pins.map((pin) => {
        const isSelected = pin.id === selectedId;
        return (
          <div
            key={pin.id}
            ref={(el) => { if (el) itemRefs.current.set(pin.id, el); }}
            onClick={() => onSelect(pin)}
            className={`
              shrink-0 w-[300px] snap-center cursor-pointer
              rounded-2xl border-2 p-4 transition-all duration-200
              ${isSelected
                ? "border-blue-500 bg-white shadow-xl scale-[1.02]"
                : `${recruitColor[pin.recruitStatus || "모집완료"]} shadow-lg hover:shadow-xl`
              }
            `}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${recruitBadge[pin.recruitStatus || "모집완료"]}`}>
                {pin.recruitStatus}
              </span>
              <span className="text-[10px] text-gray-400">{pin.subType || pin.type}</span>
            </div>
            <p className="text-[13px] font-bold text-gray-900 leading-snug line-clamp-2 mb-1">
              {pin.complexName || pin.title}
            </p>
            <p className="text-[11px] text-gray-500 truncate">📍 {pin.address}</p>
            {pin.extra && (
              <p className="text-[12px] text-blue-600 font-semibold mt-1">💰 {pin.extra}</p>
            )}
            <p className="text-[10px] text-gray-400 mt-1">모집 {pin.date}</p>
          </div>
        );
      })}

      {/* 오른쪽 여백 */}
      <div className="shrink-0 w-[calc(50vw-150px)]" />
    </div>
  );
}
