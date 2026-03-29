"use client";

import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";

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

export interface KakaoMapHandle {
  openPin: (pinId: string) => void;
}

interface KakaoMapProps {
  pins?: MapPin[];
  className?: string;
  onPinClick?: (pin: MapPin) => void;
  flyTo?: { lat: number; lng: number; level: number } | null;
}

export const KakaoMap = forwardRef<KakaoMapHandle, KakaoMapProps>(function KakaoMap(
  { pins = [], className = "w-full h-full", onPinClick, flyTo },
  ref
) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const overlayRef = useRef<any>(null);
  const onPinClickRef = useRef(onPinClick);
  const pinsRef = useRef(pins);
  onPinClickRef.current = onPinClick;
  pinsRef.current = pins;

  function showOverlay(map: any, pin: MapPin) {
    const { kakao } = window;
    if (overlayRef.current) overlayRef.current.setMap(null);

    const position = new kakao.maps.LatLng(pin.lat, pin.lng);
    const statusColors: Record<string, string> = {
      일반공고: "#3B82F6",
      정정공고: "#F97316",
    };
    const color = statusColors[pin.status || ""] || "#3B82F6";

    const truncTitle = pin.title.length > 50 ? pin.title.slice(0, 50) + "…" : pin.title;
    const truncAddr = pin.address && pin.address.length > 40 ? pin.address.slice(0, 40) + "…" : pin.address;

    const el = document.createElement("div");
    el.innerHTML = `
      <div style="position:relative;background:white;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,0.18);padding:14px 14px 12px;width:280px;font-family:-apple-system,sans-serif;overflow:hidden;word-break:break-word;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
          <span style="background:${color};color:white;font-size:10px;padding:2px 8px;border-radius:10px;white-space:nowrap;">${pin.status || ""}</span>
          <span style="font-size:10px;color:#888;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${pin.type || ""}${pin.subType ? " · " + pin.subType : ""}</span>
        </div>
        <div style="font-size:13px;font-weight:700;line-height:1.4;margin-bottom:6px;color:#111;">${truncTitle}</div>
        ${truncAddr ? `<div style="font-size:11px;color:#555;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">📍 ${truncAddr}</div>` : ""}
        ${pin.extra ? `<div style="font-size:11px;color:#2563EB;margin-bottom:4px;">💰 ${pin.extra}</div>` : ""}
        ${pin.date ? `<div style="font-size:10px;color:#aaa;">${pin.date}</div>` : ""}
        ${pin.url ? `<a href="${pin.url}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin-top:8px;font-size:12px;color:#3B82F6;text-decoration:none;font-weight:500;">공고 상세보기 →</a>` : ""}
        <div style="position:absolute;top:10px;right:12px;cursor:pointer;font-size:14px;color:#bbb;line-height:1;" data-close="1">✕</div>
      </div>
    `;

    el.querySelector("[data-close]")?.addEventListener("click", () => {
      ov.setMap(null);
    });

    const ov = new kakao.maps.CustomOverlay({
      content: el,
      map,
      position,
      yAnchor: 1.35,
    });

    overlayRef.current = ov;
    map.panTo(position);
  }

  // 외부에서 핀 열기
  useImperativeHandle(ref, () => ({
    openPin(pinId: string) {
      const map = mapInstanceRef.current;
      if (!map || !window.kakao?.maps) return;
      const pin = pinsRef.current.find((p) => p.id === pinId);
      if (pin) showOverlay(map, pin);
    },
  }));

  // SDK 로드 + 초기화
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
      drawMarkers(map, pinsRef.current);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // flyTo
  useEffect(() => {
    if (!flyTo) return;
    const map = mapInstanceRef.current;
    if (!map || !window.kakao?.maps) return;
    const { kakao } = window;
    map.panTo(new kakao.maps.LatLng(flyTo.lat, flyTo.lng));
    map.setLevel(flyTo.level, { animate: true });
  }, [flyTo]);

  // pins 변경
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.kakao?.maps) return;
    drawMarkers(map, pins);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pins]);

  function drawMarkers(map: any, pinList: MapPin[]) {
    const { kakao } = window;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = new Map();
    if (overlayRef.current) overlayRef.current.setMap(null);

    if (pinList.length === 0) return;

    pinList.forEach((pin) => {
      const position = new kakao.maps.LatLng(pin.lat, pin.lng);
      const marker = new kakao.maps.Marker({ map, position, title: pin.title });

      kakao.maps.event.addListener(marker, "click", () => {
        showOverlay(map, pin);
        if (onPinClickRef.current) onPinClickRef.current(pin);
      });

      markersRef.current.set(pin.id, marker);
    });
  }

  return <div ref={mapRef} className={className} />;
});
