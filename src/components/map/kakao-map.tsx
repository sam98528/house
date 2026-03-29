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
  supplyCount?: number;
  rentDeposit?: string;
  monthlyRent?: string;
  supplyOrg?: string;
  houseType?: string;
  announceDe?: string;
  winnerDe?: string;
  heatMethod?: string;
}

export interface KakaoMapHandle {
  flyToPin: (pin: MapPin) => void;
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
  const onPinClickRef = useRef(onPinClick);
  const pinsRef = useRef(pins);
  onPinClickRef.current = onPinClick;
  pinsRef.current = pins;

  // 외부에서 핀 위치로 이동 (사이드 패널 폭 고려하여 약간 오른쪽으로)
  useImperativeHandle(ref, () => ({
    flyToPin(pin: MapPin) {
      const map = mapInstanceRef.current;
      if (!map || !window.kakao?.maps) return;
      const { kakao } = window;
      // 사이드 패널(380px) 고려하여 중심을 약간 오른쪽으로
      const proj = map.getProjection();
      const point = proj.pointFromCoords(new kakao.maps.LatLng(pin.lat, pin.lng));
      point.x -= 150; // 패널 폭의 절반만큼 왼쪽으로 → 보이는 영역에서 중앙
      const adjusted = proj.coordsFromPoint(point);
      map.panTo(adjusted);
      map.setLevel(4, { animate: true });
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

  // flyTo (현재위치 등)
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

    pinList.forEach((pin) => {
      const position = new kakao.maps.LatLng(pin.lat, pin.lng);
      const marker = new kakao.maps.Marker({ map, position, title: pin.title });

      kakao.maps.event.addListener(marker, "click", () => {
        if (onPinClickRef.current) onPinClickRef.current(pin);
      });

      markersRef.current.set(pin.id, marker);
    });
  }

  return <div ref={mapRef} className={className} />;
});
