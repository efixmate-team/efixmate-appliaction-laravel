"use client";

import { useEffect, useRef, useState } from "react";
import {
  Search, Loader2, MapPin, X, MousePointer2, Trash2, CheckCircle, RotateCcw,
} from "lucide-react";
import { renderExistingAreas, type AreaPoint } from "./_areaLayers";
import {
  searchPlaces,
  getPlacePosition,
  resetPlaceSearchSession,
  type PlaceSuggestion,
} from "./_placeSearch";
import { loadGoogleMaps } from "@/lib/gmapsLoader";
import type { MapFlyTo } from "./_geographyMapFocus";

export type PolygonCoords = [number, number][];

interface Props {
  initialPolygon?: PolygonCoords;
  existingAreas?: AreaPoint[];
  excludeAreaId?: number;
  /** Map canvas height — number (px) or CSS length (e.g. `min(72vh, 820px)`). Default 360. */
  mapHeight?: number | string;
  /** Pan/zoom when geography (country / state / city) selection changes. */
  mapFlyTo?: MapFlyTo | null;
  onPolygonChange: (polygon: PolygonCoords, centroid: [number, number], radiusKm: number) => void;
}

function computeCentroid(pts: PolygonCoords): [number, number] {
  return [
    pts.reduce((s, p) => s + p[0], 0) / pts.length,
    pts.reduce((s, p) => s + p[1], 0) / pts.length,
  ];
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function maxRadius(centroid: [number, number], pts: PolygonCoords): number {
  if (!pts.length) return 0;
  return Math.max(...pts.map((p) => haversineKm(centroid[0], centroid[1], p[0], p[1])));
}

type Overlay = google.maps.Polygon | google.maps.Circle | google.maps.Marker | google.maps.Polyline;

export default function PolygonPicker({
  initialPolygon,
  existingAreas = [],
  excludeAreaId,
  mapHeight = 360,
  mapFlyTo = null,
  onPolygonChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const existingLayersRef = useRef<Overlay[]>([]);
  const existingAreasRef = useRef(existingAreas);
  existingAreasRef.current = existingAreas;

  const pointsRef = useRef<PolygonCoords>([]);
  const vertexMarkersRef = useRef<google.maps.Marker[]>([]);
  const previewLineRef = useRef<google.maps.Polyline | null>(null);
  const previewFillRef = useRef<google.maps.Polygon | null>(null);
  const finalPolyRef = useRef<google.maps.Polygon | null>(null);
  const centroidDotRef = useRef<google.maps.Marker | null>(null);
  const searchPinRef = useRef<google.maps.Marker | null>(null);
  const searchInfoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const pendingSearchPinRef = useRef<{ lat: number; lng: number; label: string } | null>(null);
  const pendingMapFlyToRef = useRef<MapFlyTo | null>(null);
  const clickListenerRef = useRef<google.maps.MapsEventListener | null>(null);
  const dblClickListenerRef = useRef<google.maps.MapsEventListener | null>(null);

  const [mode, setMode] = useState<"idle" | "drawing">("idle");
  const modeRef = useRef<"idle" | "drawing">("idle");
  modeRef.current = mode;

  const [vertexCount, setVertexCount] = useState(0);
  const [done, setDone] = useState(false);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDrop, setShowDrop] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const [selectedPlace, setSelectedPlace] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [searchEmpty, setSearchEmpty] = useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node))
        setShowDrop(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleSearch(val: string) {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim() || val.length < 2) {
      setSuggestions([]);
      setShowDrop(false);
      setSearchEmpty(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      setSearchEmpty(false);
      try {
        const data = await searchPlaces(val, {
          limit: 12,
          existingAreas: existingAreasRef.current,
          excludeAreaId,
        });
        setSuggestions(data);
        setShowDrop(true);
        setSearchEmpty(data.length === 0);
      } catch {
        setSuggestions([]);
        setShowDrop(true);
        setSearchEmpty(true);
      } finally {
        setSearching(false);
      }
    }, 450);
  }

  function shortPlaceLabel(displayName: string) {
    return displayName.split(",").slice(0, 2).join(",").trim();
  }

  // ── Search pin helpers ────────────────────────────────────────────────────

  function applyMapFlyTo(map: google.maps.Map, target: MapFlyTo) {
    if (target.type === "point") {
      map.setCenter({ lat: target.lat, lng: target.lng });
      map.setZoom(target.zoom);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    target.points.forEach(([lat, lng]) => bounds.extend({ lat, lng }));
    map.fitBounds(bounds, target.padding ?? 48);
  }

  function clearSearchPin() {
    searchInfoWindowRef.current?.close();
    searchInfoWindowRef.current = null;
    searchPinRef.current?.setMap(null);
    searchPinRef.current = null;
  }

  function placeSearchPin(map: google.maps.Map, lat: number, lng: number, label: string) {
    clearSearchPin();

    const pinSvg = encodeURIComponent(
      `<svg viewBox="0 0 24 36" width="28" height="40" xmlns="http://www.w3.org/2000/svg">` +
      `<path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#ef4444"/>` +
      `<circle cx="12" cy="12" r="5" fill="#fff"/>` +
      `</svg>`
    );

    const marker = new google.maps.Marker({
      position: { lat, lng },
      map,
      icon: {
        url: `data:image/svg+xml;charset=UTF-8,${pinSvg}`,
        scaledSize: new google.maps.Size(28, 40),
        anchor: new google.maps.Point(14, 40),
      },
      zIndex: 1000,
      title: label,
    });

    const infoWindow = new google.maps.InfoWindow({
      content: `<div style="font-family:system-ui,sans-serif;min-width:140px;padding:2px 0">
        <p style="margin:0 0 4px;font-weight:700;font-size:13px;color:#0f172a">${label}</p>
        <p style="margin:0;font-size:11px;color:#64748b">Draw the service area boundary around this location.</p>
      </div>`,
    });

    searchPinRef.current = marker;
    searchInfoWindowRef.current = infoWindow;

    map.setCenter({ lat, lng });
    map.setZoom(16);
    setTimeout(() => {
      try { infoWindow.open({ map, anchor: marker }); } catch {}
    }, 350);
  }

  async function selectSuggestion(s: PlaceSuggestion) {
    const label = shortPlaceLabel(s.display_name);
    setQuery(label);
    setSuggestions([]);
    setShowDrop(false);

    const coords = await getPlacePosition(s.place_id, { lat: s.lat, lon: s.lon });
    if (!coords) return;

    const { lat, lng } = coords;
    setSelectedPlace({ lat, lng, label });

    const map = mapRef.current;
    if (map) {
      placeSearchPin(map, lat, lng, label);
    } else {
      pendingSearchPinRef.current = { lat, lng, label };
    }
  }

  // ── Drawing helpers ───────────────────────────────────────────────────────

  function updatePreview(map: google.maps.Map, pts: PolygonCoords) {
    previewLineRef.current?.setMap(null);
    previewFillRef.current?.setMap(null);
    previewLineRef.current = null;
    previewFillRef.current = null;

    if (pts.length >= 2) {
      previewLineRef.current = new google.maps.Polyline({
        path: pts.map(([lat, lng]) => ({ lat, lng })),
        strokeColor: "#3b82f6",
        strokeWeight: 2,
        strokeOpacity: 0.9,
        map,
      });
    }
    if (pts.length >= 3) {
      previewFillRef.current = new google.maps.Polygon({
        paths: pts.map(([lat, lng]) => ({ lat, lng })),
        strokeOpacity: 0,
        fillColor: "#3b82f6",
        fillOpacity: 0.1,
        clickable: false,
        map,
      });
    }
  }

  function clearAllLayers(map: google.maps.Map) {
    vertexMarkersRef.current.forEach(m => m.setMap(null));
    vertexMarkersRef.current = [];
    previewLineRef.current?.setMap(null); previewLineRef.current = null;
    previewFillRef.current?.setMap(null); previewFillRef.current = null;
    finalPolyRef.current?.setMap(null); finalPolyRef.current = null;
    centroidDotRef.current?.setMap(null); centroidDotRef.current = null;
    pointsRef.current = [];
    setVertexCount(0);
    setDone(false);
  }

  function addVertex(pt: [number, number], map: google.maps.Map) {
    pointsRef.current = [...pointsRef.current, pt];
    setVertexCount(pointsRef.current.length);

    const marker = new google.maps.Marker({
      position: { lat: pt[0], lng: pt[1] },
      map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 6,
        fillColor: "white",
        fillOpacity: 1,
        strokeColor: "#3b82f6",
        strokeWeight: 2.5,
      },
      clickable: false,
      optimized: false,
    });
    vertexMarkersRef.current.push(marker);
    updatePreview(map, pointsRef.current);
  }

  function stopDrawing(map: google.maps.Map) {
    if (clickListenerRef.current) {
      google.maps.event.removeListener(clickListenerRef.current);
      clickListenerRef.current = null;
    }
    if (dblClickListenerRef.current) {
      google.maps.event.removeListener(dblClickListenerRef.current);
      dblClickListenerRef.current = null;
    }
    map.setOptions({ draggableCursor: "" });
  }

  function finalize(map: google.maps.Map) {
    const pts = pointsRef.current;
    if (pts.length < 3) return;

    stopDrawing(map);

    vertexMarkersRef.current.forEach(m => m.setMap(null));
    vertexMarkersRef.current = [];
    previewLineRef.current?.setMap(null); previewLineRef.current = null;
    previewFillRef.current?.setMap(null); previewFillRef.current = null;

    finalPolyRef.current = new google.maps.Polygon({
      paths: pts.map(([lat, lng]) => ({ lat, lng })),
      strokeColor: "#3b82f6",
      strokeWeight: 2.5,
      strokeOpacity: 0.9,
      fillColor: "#3b82f6",
      fillOpacity: 0.15,
      clickable: false,
      map,
    });

    const c = computeCentroid(pts);
    centroidDotRef.current = new google.maps.Marker({
      position: { lat: c[0], lng: c[1] },
      map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 6,
        fillColor: "#3b82f6",
        fillOpacity: 1,
        strokeColor: "white",
        strokeWeight: 2,
      },
      clickable: false,
      optimized: false,
    });

    const bounds = new google.maps.LatLngBounds();
    pts.forEach(([lat, lng]) => bounds.extend({ lat, lng }));
    map.fitBounds(bounds, 40);

    setMode("idle");
    setDone(true);
    onPolygonChange(pts, c, parseFloat(maxRadius(c, pts).toFixed(2)));
  }

  function startDrawing(map: google.maps.Map) {
    clearAllLayers(map);
    setMode("drawing");
    map.setOptions({ draggableCursor: "crosshair" });

    // Debounce to distinguish single click vs double-click
    let clickTimer: ReturnType<typeof setTimeout> | null = null;
    let pendingPt: [number, number] | null = null;

    clickListenerRef.current = map.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (modeRef.current !== "drawing" || !e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

      if (clickTimer) {
        // Second click within debounce window — part of a double-click, discard
        clearTimeout(clickTimer);
        clickTimer = null;
        pendingPt = null;
        return;
      }

      pendingPt = [lat, lng];
      clickTimer = setTimeout(() => {
        if (pendingPt) addVertex(pendingPt, map);
        pendingPt = null;
        clickTimer = null;
      }, 220);
    });

    dblClickListenerRef.current = map.addListener("dblclick", () => {
      if (modeRef.current !== "drawing") return;
      if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; pendingPt = null; }
      if (pointsRef.current.length >= 3) finalize(map);
    });
  }

  function renderExisting(map: google.maps.Map) {
    existingLayersRef.current.forEach(o => (o as any).setMap(null));
    existingLayersRef.current = renderExistingAreas(map, existingAreasRef.current, {
      excludeAreaId,
      interactive: false,
    }) as Overlay[];
  }

  function renderPolygon(map: google.maps.Map, pts: PolygonCoords) {
    finalPolyRef.current = new google.maps.Polygon({
      paths: pts.map(([lat, lng]) => ({ lat, lng })),
      strokeColor: "#3b82f6",
      strokeWeight: 2.5,
      strokeOpacity: 0.9,
      fillColor: "#3b82f6",
      fillOpacity: 0.15,
      clickable: false,
      map,
    });

    const c = computeCentroid(pts);
    centroidDotRef.current = new google.maps.Marker({
      position: { lat: c[0], lng: c[1] },
      map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 6,
        fillColor: "#3b82f6",
        fillOpacity: 1,
        strokeColor: "white",
        strokeWeight: 2,
      },
      clickable: false,
      optimized: false,
    });

    const bounds = new google.maps.LatLngBounds();
    pts.forEach(([lat, lng]) => bounds.extend({ lat, lng }));
    map.fitBounds(bounds, 60);
  }

  // ── Map init ──────────────────────────────────────────────────────────────

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
        disableDoubleClickZoom: true,
      });

      mapRef.current = map;
      renderExisting(map);

      if (initialPolygon && initialPolygon.length >= 3) {
        pointsRef.current = initialPolygon;
        setVertexCount(initialPolygon.length);
        renderPolygon(map, initialPolygon);
        setDone(true);
      }

      if (pendingSearchPinRef.current) {
        const p = pendingSearchPinRef.current;
        placeSearchPin(map, p.lat, p.lng, p.label);
        pendingSearchPinRef.current = null;
      }

      if (pendingMapFlyToRef.current) {
        applyMapFlyTo(map, pendingMapFlyToRef.current);
        pendingMapFlyToRef.current = null;
      } else if (mapFlyTo) {
        applyMapFlyTo(map, mapFlyTo);
      }
    });

    return () => {
      cancelled = true;
      if (clickListenerRef.current) google.maps.event.removeListener(clickListenerRef.current);
      if (dblClickListenerRef.current) google.maps.event.removeListener(dblClickListenerRef.current);
      vertexMarkersRef.current.forEach(m => m.setMap(null));
      previewLineRef.current?.setMap(null);
      previewFillRef.current?.setMap(null);
      finalPolyRef.current?.setMap(null);
      centroidDotRef.current?.setMap(null);
      searchPinRef.current?.setMap(null);
      searchInfoWindowRef.current?.close();
      existingLayersRef.current.forEach(o => (o as any).setMap(null));
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (map) renderExisting(map);
  }, [existingAreas, excludeAreaId]);

  useEffect(() => {
    if (!mapFlyTo) return;
    const map = mapRef.current;
    if (map) {
      applyMapFlyTo(map, mapFlyTo);
    } else {
      pendingMapFlyToRef.current = mapFlyTo;
    }
  }, [mapFlyTo]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleDraw() {
    const map = mapRef.current;
    if (map) startDrawing(map);
  }

  function handleComplete() {
    const map = mapRef.current;
    if (map) finalize(map);
  }

  function handleClear() {
    const map = mapRef.current;
    if (!map) return;
    stopDrawing(map);
    clearAllLayers(map);
    setMode("idle");
    onPolygonChange([], [20.5937, 78.9629], 0);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Search */}
      <div className="relative mb-2" ref={searchBoxRef}>
        <div className="flex items-center gap-2 px-3 py-2.5 bg-[#ffffff] rounded-xl border border-[#e2e8f0] shadow-sm focus-within:border-[#60a5fa] focus-within:ring-2 focus-within:ring-[#eff6ff] transition-all">
          {searching
            ? <Loader2 className="w-4 h-4 text-[#eff6ff] shrink-0 animate-spin" />
            : <Search className="w-4 h-4 text-[#5c6a7f] shrink-0" />}
          <input
            type="text" value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => suggestions.length > 0 && setShowDrop(true)}
            placeholder="Search place or city (e.g. Rai, Raipur, Shankar Nagar)…"
            className="flex-1 text-[13px] bg-transparent outline-none text-[#334155] placeholder:text-[#5c6a7f]"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery(""); setSuggestions([]); setShowDrop(false); setSelectedPlace(null);
                resetPlaceSearchSession();
                clearSearchPin();
              }}
            >
              <X className="w-3.5 h-3.5 text-[#5c6a7f] hover:text-[#475569]" />
            </button>
          )}
        </div>

        {showDrop && searchEmpty && !searching && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-[#ffffff] rounded-xl border border-[#e2e8f0] shadow-xl z-[9999] px-4 py-3 text-[13px] text-[#53697e]">
            No places found. Try a nearby city name (e.g. &quot;Raipur&quot;) or draw the boundary manually.
          </div>
        )}

        {showDrop && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-[#ffffff] rounded-xl border border-[#e2e8f0] shadow-xl z-[9999] overflow-hidden max-h-52 overflow-y-auto">
            {suggestions.map((s) => {
              const parts = s.display_name.split(",");
              return (
                <button key={s.place_id} type="button" onClick={() => void selectSuggestion(s)}
                  className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-[#eff6ff] transition-colors text-left border-b border-[#f8fafc] last:border-0">
                  <MapPin className="w-3.5 h-3.5 text-[#eff6ff] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-[#1e293b] truncate">{parts.slice(0, 2).join(",").trim()}</p>
                    <p className="text-[11px] text-[#5c6a7f] truncate">{parts.slice(2).join(",").trim()}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedPlace && (
        <p className="text-[11px] text-[#475569] mb-2 flex items-start gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-[#7b5757] shrink-0 mt-0.5" />
          <span>
            Pinned: <strong>{selectedPlace.label}</strong>
            <span className="text-[#5c6a7f] ml-1">({selectedPlace.lat.toFixed(5)}, {selectedPlace.lng.toFixed(5)})</span>
            {" "}— use <strong>Draw Polygon</strong> to outline the service area.
          </span>
        </p>
      )}

      {existingAreas.length > 0 && (
        <p className="text-[11px] text-[#53697e] mb-2">
          <span className="inline-block w-3 h-3 rounded-sm border border-[#94a3b8] align-middle mr-1.5" />
          Shaded shapes are existing areas (
          {excludeAreaId != null
            ? existingAreas.filter((a) => a.area_id !== excludeAreaId).length
            : existingAreas.length}
          ). Draw your new boundary in <strong className="text-[#2563eb]">blue</strong>.
        </p>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {mode === "idle" && !done && (
          <button type="button" onClick={handleDraw}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl bg-[#2563eb] text-[#ffffff] hover:bg-[#1d4ed8] transition-colors">
            <MousePointer2 className="w-3.5 h-3.5" />Draw Polygon
          </button>
        )}
        {mode === "drawing" && (
          <>
            <span className="text-xs px-2.5 py-1.5 bg-[#eff6ff] border border-[#bfdbfe] rounded-lg text-[#1d4ed8] font-medium">
              Click to add points ({vertexCount} added) · Double-click to finish
            </span>
            {vertexCount >= 3 && (
              <button type="button" onClick={handleComplete}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl bg-[#16a34a] text-[#ffffff] hover:bg-[#15803d] transition-colors">
                <CheckCircle className="w-3.5 h-3.5" />Complete ({vertexCount} pts)
              </button>
            )}
          </>
        )}
        {done && mode === "idle" && (
          <>
            <span className="text-xs px-2.5 py-1.5 bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg text-[#15803d] font-medium">
              ✓ Polygon ready — {vertexCount} vertices
            </span>
            <button type="button" onClick={handleDraw}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#334155] transition-colors">
              <RotateCcw className="w-3.5 h-3.5" />Redraw
            </button>
          </>
        )}
        {(done || mode === "drawing") && (
          <button type="button" onClick={handleClear}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border border-[#fecaca] text-[#dc2626] hover:bg-[#fef2f2] transition-colors">
            <Trash2 className="w-3.5 h-3.5" />Clear
          </button>
        )}
      </div>

      {/* Map canvas */}
      <div className="rounded-xl overflow-hidden border border-[#e2e8f0]" style={{ height: mapHeight }}>
        <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      </div>
    </>
  );
}
