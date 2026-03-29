"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

interface MapPin {
  lat: number;
  lng: number;
  title: string;
  info?: string;
}

interface LeafletMapProps {
  pins?: MapPin[];
  center?: [number, number];
  zoom?: number;
  className?: string;
}

function LeafletMapInner({
  pins = [],
  center = [36.5, 127.5],
  zoom = 7,
  className = "w-full h-[400px] rounded-lg",
}: LeafletMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={`${className} bg-gray-100 animate-pulse`} />;
  }

  // Dynamic import inside client component to avoid SSR issues
  const L = require("leaflet");
  const { MapContainer, TileLayer, Marker, Popup } = require("react-leaflet");

  // Leaflet 기본 마커 아이콘 fix (webpack 이슈)
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });

  // 핀이 있으면 bounds 계산
  let mapCenter = center;
  let mapZoom = zoom;
  if (pins.length === 1) {
    mapCenter = [pins[0].lat, pins[0].lng];
    mapZoom = 13;
  }

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
      />
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        className={className}
        style={{ zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {pins.map((pin, i) => (
          <Marker key={i} position={[pin.lat, pin.lng]}>
            <Popup>
              <strong>{pin.title}</strong>
              {pin.info && <div className="text-xs mt-1">{pin.info}</div>}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </>
  );
}

// SSR 비활성화 — Leaflet은 window 객체 필요
export const LeafletMap = dynamic(
  () => Promise.resolve(LeafletMapInner),
  { ssr: false }
);
