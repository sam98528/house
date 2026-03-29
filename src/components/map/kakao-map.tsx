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
  recruitStatus?: "모집중" | "모집예정" | "모집완료";
  type?: string;
  subType?: string;
  region?: string;
  brtcNm?: string;
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
  showRegionBorder: (regionName: string) => void;
  clearRegionBorder: () => void;
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
  const polygonsRef = useRef<any[]>([]);
  const geoDataRef = useRef<any>(null);
  const onPinClickRef = useRef(onPinClick);
  const pinsRef = useRef(pins);
  onPinClickRef.current = onPinClick;
  pinsRef.current = pins;

  // GeoJSON → DB 시도명 매핑
  const GEO_NAME_MAP: Record<string, string> = {
    "서울특별시": "서울특별시",
    "부산광역시": "부산광역시",
    "대구광역시": "대구광역시",
    "인천광역시": "인천광역시",
    "광주광역시": "광주광역시",
    "대전광역시": "대전광역시",
    "울산광역시": "울산광역시",
    "세종특별자치시": "세종특별자치시",
    "경기도": "경기도",
    "강원도": "강원특별자치도",
    "충청북도": "충청북도",
    "충청남도": "충청남도",
    "전라북도": "전북특별자치도",
    "전라남도": "전라남도",
    "경상북도": "경상북도",
    "경상남도": "경상남도",
    "제주특별자치도": "제주특별자치도",
  };
  // 역매핑
  const DB_NAME_MAP: Record<string, string> = {};
  Object.entries(GEO_NAME_MAP).forEach(([geo, db]) => { DB_NAME_MAP[db] = geo; });

  useImperativeHandle(ref, () => ({
    flyToPin(pin: MapPin & { _level?: number }) {
      const map = mapInstanceRef.current;
      if (!map || !window.kakao?.maps) return;
      const { kakao } = window;
      const target = new kakao.maps.LatLng(pin.lat, pin.lng);
      const targetLevel = (pin as any)._level;

      if (targetLevel) {
        // 지역 이동: 특정 줌 레벨로
        map.setLevel(targetLevel, { animate: true });
        setTimeout(() => map.panTo(target), 200);
      } else {
        // 단지 이동: 줌인 후 이동
        const currentLevel = map.getLevel();
        if (currentLevel > 6) {
          map.setLevel(5, { animate: true });
          setTimeout(() => map.panTo(target), 300);
        } else {
          map.panTo(target);
        }
      }
    },
    showRegionBorder(dbRegionName: string) {
      const map = mapInstanceRef.current;
      if (!map || !window.kakao?.maps) return;
      // 기존 폴리곤 제거
      polygonsRef.current.forEach(p => p.setMap(null));
      polygonsRef.current = [];

      const geoName = DB_NAME_MAP[dbRegionName];
      if (!geoName || !geoDataRef.current) return;

      const { kakao } = window;
      const feature = geoDataRef.current.features.find(
        (f: any) => f.properties.name === geoName
      );
      if (!feature) return;

      const coords = feature.geometry.coordinates;
      const type = feature.geometry.type;

      const drawPolygon = (ring: number[][]) => {
        const path = ring.map(([lng, lat]: number[]) => new kakao.maps.LatLng(lat, lng));
        const polygon = new kakao.maps.Polygon({
          map,
          path,
          strokeWeight: 3,
          strokeColor: "#3B82F6",
          strokeOpacity: 0.8,
          fillColor: "#3B82F6",
          fillOpacity: 0.08,
        });
        polygonsRef.current.push(polygon);
      };

      if (type === "Polygon") {
        coords.forEach((ring: number[][]) => drawPolygon(ring));
      } else if (type === "MultiPolygon") {
        coords.forEach((polygon: number[][][]) => {
          polygon.forEach((ring: number[][]) => drawPolygon(ring));
        });
      }

      // bounds 맞추기
      const bounds = new kakao.maps.LatLngBounds();
      polygonsRef.current.forEach(p => {
        const path = p.getPath();
        path.forEach((latlng: any) => bounds.extend(latlng));
      });
      map.setBounds(bounds, 50, 50, 50, 50);
    },
    clearRegionBorder() {
      polygonsRef.current.forEach(p => p.setMap(null));
      polygonsRef.current = [];
    },
  }));

  // GeoJSON 로드
  useEffect(() => {
    fetch("/geo/provinces.json")
      .then(r => r.json())
      .then(data => { geoDataRef.current = data; })
      .catch(() => {});
  }, []);

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
