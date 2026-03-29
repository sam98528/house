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
}

export const KakaoMap = forwardRef<KakaoMapHandle, KakaoMapProps>(function KakaoMap(
  { pins = [], className = "w-full h-full", onPinClick },
  ref
) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const onPinClickRef = useRef(onPinClick);
  const pinsRef = useRef(pins);
  onPinClickRef.current = onPinClick;
  pinsRef.current = pins;

  useImperativeHandle(ref, () => ({
    flyToPin(pin: MapPin) {
      const map = mapInstanceRef.current;
      if (!map || !window.kakao?.maps) return;
      const { kakao } = window;
      const target = new kakao.maps.LatLng(pin.lat, pin.lng);

      // 현재 레벨이 7 이상이면 먼저 줌인
      const currentLevel = map.getLevel();
      if (currentLevel > 6) {
        map.setLevel(5, { animate: true });
        // 줌 애니메이션 후 부드럽게 이동
        setTimeout(() => map.panTo(target), 300);
      } else {
        map.panTo(target);
      }
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
        // 핀 클릭: 현재 줌 유지, 부드럽게 이동만
        map.panTo(position);
        if (onPinClickRef.current) onPinClickRef.current(pin);
      });

      markersRef.current.set(pin.id, marker);
    });
  }

  return <div ref={mapRef} className={className} />;
});
