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
  highlightPin: (pinId: string | null) => void;
  getVisiblePins: () => MapPin[];
}

interface KakaoMapProps {
  pins?: MapPin[];
  className?: string;
  onPinClick?: (pin: MapPin) => void;
  onBoundsChanged?: (visiblePins: MapPin[]) => void;
}

// 선택된 마커용 커스텀 이미지 SVG (빨간색)
const SELECTED_MARKER_SVG = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="33" height="44"><path d="M16.5 0C7.4 0 0 7.4 0 16.5S16.5 44 16.5 44 33 25.6 33 16.5 25.6 0 16.5 0z" fill="#EF4444"/><circle cx="16.5" cy="16.5" r="7" fill="white"/></svg>'
)}`;

const GEO_NAME_MAP: Record<string, string> = {
  "서울특별시": "서울특별시", "부산광역시": "부산광역시", "대구광역시": "대구광역시",
  "인천광역시": "인천광역시", "광주광역시": "광주광역시", "대전광역시": "대전광역시",
  "울산광역시": "울산광역시", "세종특별자치시": "세종특별자치시", "경기도": "경기도",
  "강원도": "강원특별자치도", "충청북도": "충청북도", "충청남도": "충청남도",
  "전라북도": "전북특별자치도", "전라남도": "전라남도", "경상북도": "경상북도",
  "경상남도": "경상남도", "제주특별자치도": "제주특별자치도",
};
const DB_NAME_MAP: Record<string, string> = {};
Object.entries(GEO_NAME_MAP).forEach(([geo, db]) => { DB_NAME_MAP[db] = geo; });

export const KakaoMap = forwardRef<KakaoMapHandle, KakaoMapProps>(function KakaoMap(
  { pins = [], className = "w-full h-full", onPinClick, onBoundsChanged },
  ref
) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const polygonsRef = useRef<any[]>([]);
  const geoDataRef = useRef<any>(null);
  const selectedMarkerRef = useRef<any>(null);
  const selectedImageRef = useRef<any>(null);
  const defaultImageRef = useRef<any>(null);
  const onPinClickRef = useRef(onPinClick);
  const onBoundsChangedRef = useRef(onBoundsChanged);
  const pinsRef = useRef(pins);
  onPinClickRef.current = onPinClick;
  onBoundsChangedRef.current = onBoundsChanged;
  pinsRef.current = pins;

  function getVisiblePinsInternal(): MapPin[] {
    const map = mapInstanceRef.current;
    if (!map || !window.kakao?.maps) return [];
    const bounds = map.getBounds();
    return pinsRef.current.filter((p) => {
      const latlng = new window.kakao.maps.LatLng(p.lat, p.lng);
      return bounds.contain(latlng);
    });
  }

  useImperativeHandle(ref, () => ({
    flyToPin(pin: MapPin & { _level?: number }) {
      const map = mapInstanceRef.current;
      if (!map || !window.kakao?.maps) return;
      const { kakao } = window;
      const target = new kakao.maps.LatLng(pin.lat, pin.lng);
      const targetLevel = (pin as any)._level;

      if (targetLevel) {
        map.setLevel(targetLevel, { animate: true });
        setTimeout(() => map.panTo(target), 200);
      } else {
        const currentLevel = map.getLevel();
        if (currentLevel > 6) {
          map.setLevel(5, { animate: true });
          setTimeout(() => map.panTo(target), 300);
        } else {
          map.panTo(target);
        }
      }
    },
    highlightPin(pinId: string | null) {
      // 이전 선택 복원
      if (selectedMarkerRef.current && defaultImageRef.current) {
        selectedMarkerRef.current.setImage(defaultImageRef.current);
        selectedMarkerRef.current = null;
      }
      if (!pinId) return;

      const marker = markersRef.current.get(pinId);
      if (!marker || !selectedImageRef.current) return;
      defaultImageRef.current = marker.getImage();
      marker.setImage(selectedImageRef.current);
      marker.setZIndex(10);
      selectedMarkerRef.current = marker;
    },
    showRegionBorder(dbRegionName: string) {
      const map = mapInstanceRef.current;
      if (!map || !window.kakao?.maps) return;
      polygonsRef.current.forEach(p => p.setMap(null));
      polygonsRef.current = [];

      const geoName = DB_NAME_MAP[dbRegionName];
      if (!geoName || !geoDataRef.current) return;

      const { kakao } = window;
      const feature = geoDataRef.current.features.find((f: any) => f.properties.name === geoName);
      if (!feature) return;

      const drawPoly = (ring: number[][]) => {
        const path = ring.map(([lng, lat]: number[]) => new kakao.maps.LatLng(lat, lng));
        polygonsRef.current.push(new kakao.maps.Polygon({
          map, path, strokeWeight: 3, strokeColor: "#3B82F6", strokeOpacity: 0.8, fillColor: "#3B82F6", fillOpacity: 0.08,
        }));
      };

      if (feature.geometry.type === "Polygon") feature.geometry.coordinates.forEach(drawPoly);
      else if (feature.geometry.type === "MultiPolygon") feature.geometry.coordinates.forEach((p: any) => p.forEach(drawPoly));

      const bounds = new kakao.maps.LatLngBounds();
      polygonsRef.current.forEach(p => p.getPath().forEach((ll: any) => bounds.extend(ll)));
      map.setBounds(bounds, 50, 50, 50, 50);
    },
    clearRegionBorder() {
      polygonsRef.current.forEach(p => p.setMap(null));
      polygonsRef.current = [];
    },
    getVisiblePins: getVisiblePinsInternal,
  }));

  // GeoJSON 로드
  useEffect(() => {
    fetch("/geo/provinces.json").then(r => r.json()).then(data => { geoDataRef.current = data; }).catch(() => {});
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

      // 선택 마커 이미지
      selectedImageRef.current = new kakao.maps.MarkerImage(
        SELECTED_MARKER_SVG, new kakao.maps.Size(33, 44),
        { offset: new kakao.maps.Point(16, 44) }
      );

      // bounds 변경 시 visible pins 콜백
      kakao.maps.event.addListener(map, "idle", () => {
        if (onBoundsChangedRef.current) {
          onBoundsChangedRef.current(getVisiblePinsInternal());
        }
      });

      drawMarkers(map, pinsRef.current);
    }

    if (window.kakao?.maps) { init(); return; }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&autoload=false&libraries=clusterer`;
    script.async = true;
    script.onload = () => { window.kakao.maps.load(() => init()); };
    document.head.appendChild(script);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        map.panTo(position);
        if (onPinClickRef.current) onPinClickRef.current(pin);
      });

      markersRef.current.set(pin.id, marker);
    });
  }

  return <div ref={mapRef} className={className} />;
});
