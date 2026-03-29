"use client";

import { useEffect, useRef, useCallback } from "react";

declare global {
  interface Window {
    kakao: any;
    kakaoMapLoaded?: boolean;
  }
}

export interface MapPin {
  id: string;
  lat: number;
  lng: number;
  title: string;
  status?: string;
  type?: string;
  subType?: string;
  date?: string;
  url?: string;
}

interface KakaoMapProps {
  pins?: MapPin[];
  center?: { lat: number; lng: number };
  level?: number;
  className?: string;
  onPinClick?: (pin: MapPin) => void;
}

export function KakaoMap({
  pins = [],
  center = { lat: 36.5, lng: 127.5 },
  level = 13,
  className = "w-full h-[500px] rounded-lg border",
  onPinClick,
}: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const overlayRef = useRef<any>(null);

  const initMap = useCallback(() => {
    if (!mapRef.current || !window.kakao?.maps) return;

    const { kakao } = window;
    const mapOption = {
      center: new kakao.maps.LatLng(center.lat, center.lng),
      level,
    };

    const map = new kakao.maps.Map(mapRef.current, mapOption);
    mapInstanceRef.current = map;

    // 줌 컨트롤
    map.addControl(
      new kakao.maps.ZoomControl(),
      kakao.maps.ControlPosition.RIGHT
    );
  }, [center, level]);

  // SDK 로드
  useEffect(() => {
    if (window.kakao?.maps) {
      if (!mapInstanceRef.current) initMap();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false&libraries=clusterer`;
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => initMap());
    };
    document.head.appendChild(script);
  }, [initMap]);

  // 핀 업데이트
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.kakao?.maps) return;

    const { kakao } = window;

    // 기존 마커 제거
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    if (overlayRef.current) overlayRef.current.setMap(null);

    if (pins.length === 0) return;

    const statusColor: Record<string, string> = {
      공고중: "#3B82F6",
      접수중: "#22C55E",
      접수마감: "#9CA3AF",
      정정공고중: "#F97316",
    };

    pins.forEach((pin) => {
      const position = new kakao.maps.LatLng(pin.lat, pin.lng);
      const color = statusColor[pin.status || ""] || "#3B82F6";

      const marker = new kakao.maps.Marker({
        map,
        position,
        title: pin.title,
      });

      // 클릭 → 커스텀 오버레이
      kakao.maps.event.addListener(marker, "click", () => {
        if (overlayRef.current) overlayRef.current.setMap(null);

        const content = document.createElement("div");
        content.innerHTML = `
          <div style="background:white;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.15);padding:14px;min-width:240px;max-width:300px;font-family:sans-serif;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
              <span style="background:${color};color:white;font-size:11px;padding:2px 8px;border-radius:10px;">${pin.status || ""}</span>
              <span style="font-size:11px;color:#666;">${pin.type || ""}${pin.subType ? " · " + pin.subType : ""}</span>
            </div>
            <div style="font-size:14px;font-weight:600;line-height:1.4;margin-bottom:6px;">${pin.title}</div>
            ${pin.date ? `<div style="font-size:11px;color:#999;">${pin.date}</div>` : ""}
            ${pin.url ? `<a href="${pin.url}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin-top:8px;font-size:12px;color:#3B82F6;text-decoration:none;">공고 상세보기 →</a>` : ""}
            <div style="position:absolute;top:8px;right:8px;cursor:pointer;font-size:16px;color:#ccc;" id="close-overlay">✕</div>
          </div>
        `;

        content.querySelector("#close-overlay")?.addEventListener("click", () => {
          overlay.setMap(null);
        });

        const overlay = new kakao.maps.CustomOverlay({
          content,
          map,
          position,
          yAnchor: 1.3,
        });

        overlayRef.current = overlay;
        map.panTo(position);

        if (onPinClick) onPinClick(pin);
      });

      markersRef.current.push(marker);
    });

    // 핀이 여러 개면 bounds 맞추기
    if (pins.length > 1) {
      const bounds = new kakao.maps.LatLngBounds();
      pins.forEach((pin) => {
        bounds.extend(new kakao.maps.LatLng(pin.lat, pin.lng));
      });
      map.setBounds(bounds);
    } else if (pins.length === 1) {
      map.setCenter(new kakao.maps.LatLng(pins[0].lat, pins[0].lng));
      map.setLevel(5);
    }
  }, [pins, onPinClick]);

  return <div ref={mapRef} className={className} />;
}
