"use client";

import { KakaoMap, type MapPin } from "./kakao-map";

export function MapView({ pins }: { pins: MapPin[] }) {
  return (
    <KakaoMap
      pins={pins}
      center={{ lat: 36.5, lng: 127.5 }}
      level={13}
      className="w-full h-[500px] rounded-lg border"
    />
  );
}
