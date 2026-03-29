"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    kakao: any;
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
  region?: string;
  address?: string;
  complexName?: string;
  date?: string;
  url?: string;
  extra?: string;
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
  className = "w-full h-full",
  onPinClick,
}: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const overlayRef = useRef<any>(null);
  const onPinClickRef = useRef(onPinClick);
  onPinClickRef.current = onPinClick;

  // SDK 로드 + 지도 초기화 (한 번만)
  useEffect(() => {
    function init() {
      if (!mapRef.current || !window.kakao?.maps) return;
      if (mapInstanceRef.current) return;

      const { kakao } = window;
      const map = new kakao.maps.Map(mapRef.current, {
        center: new kakao.maps.LatLng(36.5, 127.5),
        level: 13,
      });
      mapInstanceRef.current = map;
    }

    if (window.kakao?.maps) {
      init();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false&libraries=clusterer`;
    script.async = true;
    script.onload = () => {
      window.kakao.maps.load(() => init());
    };
    document.head.appendChild(script);
  }, []);

  // center/level 변경 시 지도 이동
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.kakao?.maps) return;
    const { kakao } = window;
    map.panTo(new kakao.maps.LatLng(center.lat, center.lng));
    map.setLevel(level, { animate: true });
  }, [center.lat, center.lng, level]);

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
      일반공고: "#3B82F6",
      정정공고: "#F97316",
    };

    pins.forEach((pin) => {
      const position = new kakao.maps.LatLng(pin.lat, pin.lng);
      const color = statusColor[pin.status || ""] || "#3B82F6";

      const marker = new kakao.maps.Marker({ map, position, title: pin.title });

      kakao.maps.event.addListener(marker, "click", () => {
        if (overlayRef.current) overlayRef.current.setMap(null);

        const content = document.createElement("div");
        content.innerHTML = `
          <div style="position:relative;background:white;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.15);padding:14px;min-width:240px;max-width:300px;font-family:sans-serif;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
              <span style="background:${color};color:white;font-size:11px;padding:2px 8px;border-radius:10px;">${pin.status || ""}</span>
              <span style="font-size:11px;color:#666;">${pin.type || ""}${pin.subType ? " · " + pin.subType : ""}</span>
            </div>
            <div style="font-size:14px;font-weight:600;line-height:1.4;margin-bottom:4px;">${pin.title}</div>
            ${pin.address ? `<div style="font-size:11px;color:#555;margin-bottom:4px;">📍 ${pin.address}</div>` : ""}
            ${pin.extra ? `<div style="font-size:11px;color:#2563EB;margin-bottom:4px;">💰 ${pin.extra}</div>` : ""}
            ${pin.date ? `<div style="font-size:11px;color:#999;">${pin.date}</div>` : ""}
            ${pin.url ? `<a href="${pin.url}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin-top:8px;font-size:12px;color:#3B82F6;text-decoration:none;">공고 상세보기 →</a>` : ""}
            <div style="position:absolute;top:8px;right:10px;cursor:pointer;font-size:16px;color:#aaa;line-height:1;" id="close-overlay">✕</div>
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

        if (onPinClickRef.current) onPinClickRef.current(pin);
      });

      markersRef.current.push(marker);
    });
  }, [pins]);

  return <div ref={mapRef} className={className} />;
}
