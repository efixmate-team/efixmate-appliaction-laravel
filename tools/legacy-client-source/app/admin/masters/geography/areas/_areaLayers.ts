export type AreaPoint = {
  area_id: number;
  area_name: string;
  latitude: string | number;
  longitude: string | number;
  radius_km: string | number;
  polygon_coordinates?: [number, number][] | null;
  city_name?: string;
  state_name?: string;
  is_active?: boolean;
};

const PALETTE = [
  "#64748b", "#78716c", "#6b7280", "#71717a",
  "#737373", "#57534e", "#4b5563", "#52525b",
];

function parsePolygonCoords(raw: unknown): [number, number][] | null {
  if (!raw) return null;
  if (Array.isArray(raw) && raw.length >= 3) return raw as [number, number][];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= 3) return parsed as [number, number][];
    } catch {
      return null;
    }
  }
  return null;
}

function polygonCentroid(pts: [number, number][]): [number, number] {
  return [
    pts.reduce((s, p) => s + p[0], 0) / pts.length,
    pts.reduce((s, p) => s + p[1], 0) / pts.length,
  ];
}

export type RenderExistingAreasOptions = {
  excludeAreaId?: number;
  interactive?: boolean;
};

type Overlay = google.maps.Polygon | google.maps.Circle | google.maps.Marker;

export function renderExistingAreas(
  map: google.maps.Map,
  areas: AreaPoint[],
  options: RenderExistingAreasOptions = {}
): Overlay[] {
  const { excludeAreaId, interactive = false } = options;
  const overlays: Overlay[] = [];
  const infoWindow = interactive ? new google.maps.InfoWindow() : null;

  areas.forEach((area, i) => {
    if (excludeAreaId != null && area.area_id === excludeAreaId) return;

    const isActive = area.is_active !== false;
    const color = isActive ? PALETTE[i % PALETTE.length] : "#cbd5e1";
    const polyCoords = parsePolygonCoords(area.polygon_coordinates);

    const location = [area.city_name, area.state_name].filter(Boolean).join(", ");
    const popupContent = `
      <div style="min-width:160px;font-family:system-ui,sans-serif;padding:4px 0">
        <p style="margin:0 0 3px;font-weight:700;font-size:13px;color:#0f172a">${area.area_name}</p>
        ${location ? `<p style="margin:0;font-size:11px;color:#64748b">${location}</p>` : ""}
        <p style="margin:4px 0 0;font-size:10px;color:#94a3b8">Existing area</p>
      </div>`;

    let labelCenter: [number, number];
    let clickTarget: google.maps.Polygon | google.maps.Circle;

    if (polyCoords) {
      labelCenter = polygonCentroid(polyCoords);
      const polygon = new google.maps.Polygon({
        paths: polyCoords.map(([lat, lng]) => ({ lat, lng })),
        strokeColor: color,
        strokeWeight: 1.5,
        strokeOpacity: isActive ? 0.85 : 0.45,
        fillColor: color,
        fillOpacity: isActive ? 0.12 : 0.04,
        clickable: interactive,
        map,
      });
      clickTarget = polygon;
      overlays.push(polygon);
    } else {
      const lat = parseFloat(String(area.latitude));
      const lng = parseFloat(String(area.longitude));
      if (Number.isNaN(lat) || Number.isNaN(lng)) return;
      labelCenter = [lat, lng];
      const radiusM = parseFloat(String(area.radius_km)) * 1000;
      const safeRadius = Number.isNaN(radiusM) || radiusM <= 0 ? 5000 : radiusM;
      const circle = new google.maps.Circle({
        center: { lat, lng },
        radius: safeRadius,
        strokeColor: color,
        strokeWeight: 1.5,
        strokeOpacity: isActive ? 0.85 : 0.45,
        fillColor: color,
        fillOpacity: isActive ? 0.08 : 0.03,
        clickable: interactive,
        map,
      });
      clickTarget = circle;
      overlays.push(circle);
    }

    if (interactive && infoWindow) {
      clickTarget.addListener("click", (e: google.maps.MapMouseEvent) => {
        infoWindow.setContent(popupContent);
        infoWindow.setPosition(e.latLng);
        infoWindow.open(map);
      });
    }

    const labelMarker = new google.maps.Marker({
      position: { lat: labelCenter[0], lng: labelCenter[1] },
      map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 0,
        fillOpacity: 0,
        strokeOpacity: 0,
      },
      label: {
        text: area.area_name,
        color: isActive ? color : "#94a3b8",
        fontSize: "10px",
        fontWeight: "700",
      },
      clickable: false,
      optimized: false,
    });
    overlays.push(labelMarker);
  });

  return overlays;
}
