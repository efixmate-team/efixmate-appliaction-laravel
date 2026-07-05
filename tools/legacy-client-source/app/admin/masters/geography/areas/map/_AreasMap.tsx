"use client";

import { useEffect, useRef } from "react";
import { loadGoogleMaps } from "@/lib/gmapsLoader";

export type AreaPoint = {
  area_id: number;
  area_name: string;
  latitude: string | number;
  longitude: string | number;
  radius_km: string | number;
  polygon_coordinates?: [number, number][] | null;
  city_name?: string;
  state_name?: string;
  country_name?: string;
  city_id?: number | string;
  state_id?: number | string;
  country_id?: number | string;
  is_active?: boolean;
};

const PALETTE = [
  "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6",
  "#06b6d4", "#f97316", "#ec4899", "#6366f1",
  "#84cc16", "#14b8a6", "#ef4444", "#0ea5e9",
];
const INACTIVE_COLOR = "#94a3b8";

function polygonCentroid(pts: [number, number][]): [number, number] {
  return [
    pts.reduce((s, p) => s + p[0], 0) / pts.length,
    pts.reduce((s, p) => s + p[1], 0) / pts.length,
  ];
}

type Overlay = google.maps.Polygon | google.maps.Circle | google.maps.Marker;

export default function AreasMap({ areas }: { areas: AreaPoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const layersRef = useRef<Overlay[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const areasRef = useRef(areas);
  areasRef.current = areas;

  function clearLayers() {
    layersRef.current.forEach(l => l.setMap(null));
    layersRef.current = [];
  }

  function renderAreas() {
    const map = mapRef.current;
    if (!map) return;

    clearLayers();

    if (!infoWindowRef.current) {
      infoWindowRef.current = new google.maps.InfoWindow();
    }
    const infoWindow = infoWindowRef.current;

    const bounds = new google.maps.LatLngBounds();
    let hasBounds = false;

    areasRef.current.forEach((area, i) => {
      const isActive = area.is_active !== false;
      const color = isActive ? PALETTE[i % PALETTE.length] : INACTIVE_COLOR;
      const polyCoords =
        Array.isArray(area.polygon_coordinates) && area.polygon_coordinates.length >= 3
          ? (area.polygon_coordinates as [number, number][])
          : null;

      const location = [area.city_name, area.state_name].filter(Boolean).join(", ");
      const typeLabel = polyCoords ? "Polygon" : `Radius: <strong>${area.radius_km} km</strong>`;
      const popupContent = `
        <div style="min-width:175px;font-family:system-ui,sans-serif;padding:4px 0">
          <p style="margin:0 0 3px;font-weight:700;font-size:14px;color:#0f172a">${area.area_name}</p>
          ${location ? `<p style="margin:0 0 4px;font-size:12px;color:#64748b">${location}</p>` : ""}
          <p style="margin:0 0 6px;font-size:12px;color:#64748b">${typeLabel}</p>
          <span style="display:inline-block;padding:2px 10px;border-radius:9999px;font-size:11px;font-weight:600;background:${isActive ? "#dcfce7" : "#f1f5f9"};color:${isActive ? "#15803d" : "#64748b"};">${isActive ? "Active" : "Inactive"}</span>
        </div>`;

      let labelCenter: { lat: number; lng: number };
      let clickTarget: google.maps.Polygon | google.maps.Circle;

      if (polyCoords) {
        const centroid = polygonCentroid(polyCoords);
        labelCenter = { lat: centroid[0], lng: centroid[1] };

        const polygon = new google.maps.Polygon({
          paths: polyCoords.map(([lat, lng]) => ({ lat, lng })),
          strokeColor: color,
          strokeWeight: isActive ? 2 : 1.5,
          strokeOpacity: isActive ? 0.9 : 0.5,
          fillColor: color,
          fillOpacity: isActive ? 0.18 : 0.05,
          map,
        });
        clickTarget = polygon;
        layersRef.current.push(polygon);
        polyCoords.forEach(([lat, lng]) => { bounds.extend({ lat, lng }); hasBounds = true; });
      } else {
        const lat = parseFloat(String(area.latitude));
        const lng = parseFloat(String(area.longitude));
        if (isNaN(lat) || isNaN(lng)) return;
        labelCenter = { lat, lng };
        const radiusM = parseFloat(String(area.radius_km)) * 1000;
        const safeRadius = isNaN(radiusM) || radiusM <= 0 ? 5000 : radiusM;

        const circle = new google.maps.Circle({
          center: { lat, lng },
          radius: safeRadius,
          strokeColor: color,
          strokeWeight: isActive ? 2 : 1.5,
          strokeOpacity: isActive ? 0.9 : 0.5,
          fillColor: color,
          fillOpacity: isActive ? 0.13 : 0.05,
          map,
        });
        clickTarget = circle;
        layersRef.current.push(circle);
        bounds.extend({ lat, lng });
        hasBounds = true;
      }

      clickTarget.addListener("click", (e: google.maps.MapMouseEvent) => {
        infoWindow.setContent(popupContent);
        infoWindow.setPosition(e.latLng);
        infoWindow.open(map);
      });

      const labelMarker = new google.maps.Marker({
        position: labelCenter,
        map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 0,
          fillOpacity: 0,
          strokeOpacity: 0,
        },
        label: {
          text: area.area_name,
          color: isActive ? "#ffffff" : "#94a3b8",
          fontSize: "11px",
          fontWeight: "700",
        },
        clickable: false,
        optimized: false,
      });
      layersRef.current.push(labelMarker);
    });

    if (hasBounds) {
      map.fitBounds(bounds, 60);
      google.maps.event.addListenerOnce(map, "idle", () => {
        if ((map.getZoom() ?? 0) > 13) map.setZoom(13);
      });
    } else {
      map.setCenter({ lat: 20.5937, lng: 78.9629 });
      map.setZoom(5);
    }
  }

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    loadGoogleMaps().then(() => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = new google.maps.Map(containerRef.current, {
        center: { lat: 20.5937, lng: 78.9629 },
        zoom: 5,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      mapRef.current = map;
      renderAreas();
    });

    return () => {
      cancelled = true;
      clearLayers();
      infoWindowRef.current?.close();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (mapRef.current) renderAreas();
  }, [areas]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
