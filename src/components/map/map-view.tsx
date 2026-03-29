"use client";

import { LeafletMap } from "./leaflet-map";

interface Pin {
  lat: number;
  lng: number;
  title: string;
  info?: string;
  count: number;
  region: string;
}

export function MapView({ pins }: { pins: Pin[] }) {
  return (
    <LeafletMap
      pins={pins}
      center={[36.5, 127.5]}
      zoom={7}
      className="w-full h-[500px] rounded-lg border"
    />
  );
}
