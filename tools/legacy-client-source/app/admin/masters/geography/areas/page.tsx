"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { CheckCircle, Copy, Trash2, Map as MapIcon, MapPinned } from "lucide-react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import PaginatedTable, { Column, Filters, DropdownFilter } from "@/app/admin/(components)/Table";
import { buildBulkCrudActions, makeIsActiveBulkHandlers } from "@/app/admin/(lib)/bulkCrudActions";
import { adminAPI, masterAPI } from "@/lib/api";
import Modal from "@/components/modals/Modal";
import type { PolygonCoords } from "./_PolygonPicker";
import type { AreaPoint } from "./_areaLayers";
import {
  resolveGeographyMapFlyTo,
  type MapFlyTo,
} from "./_geographyMapFocus";

import AsyncSelect from "@/app/admin/(components)/Forms/AsyncSelect";
import Toggle from "@/app/admin/(components)/Forms/Toggle";
import SuccessOverlay from "@/app/admin/(components)/Overlay/Successoverlay";
import FailedOverlay from "@/app/admin/(components)/Overlay/Failedoverlay";
import { useGeographyFilterOptions } from "@/app/admin/(lib)/tableFilters";

const LeafletPolygonPicker = dynamic(() => import("./_PolygonPicker"), { ssr: false });

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629];
/** Large map canvas for add/edit area (most of the viewport). */
const AREA_FORM_MAP_HEIGHT = "min(72vh, 820px)";

export default function AreasPage() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [filterCountryId, setFilterCountryId] = useState("");
  const [filterStateId, setFilterStateId] = useState("");
  const [filterCityId, setFilterCityId] = useState("");
  const geoOptions = useGeographyFilterOptions(filterCountryId, filterStateId, filterCityId);
  const [loading, setLoading] = useState(false);

  const [successOverlay, setSuccessOverlay] = useState(false);
  const [failedOverlay, setFailedOverlay] = useState(false);
  const [failedMsg, setFailedMsg] = useState("Unable to save changes.");
  const [openCreateForm, setOpenCreateForm] = useState(false);
  const [openEditForm, setOpenEditForm] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<any>(null);
  const [editRow, setEditRow] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);

  // ── Copy Setup state ──────────────────────────────────────────────────────────
  const [openCopyModal, setOpenCopyModal] = useState(false);
  const [copySourceRow, setCopySourceRow] = useState<any>(null);
  const [copyTargetAreaId, setCopyTargetAreaId] = useState("");
  const [copyLoading, setCopyLoading] = useState(false);
  const [copyStats, setCopyStats] = useState<Record<string, number> | null>(null);

  // â"€â"€ Create form state â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const [createForm, setCreateForm] = useState({
    area_name: "",
    city_id: "",
    area_type_id: "",
    is_active: true,
  });
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [createPolygon, setCreatePolygon] = useState<PolygonCoords>([]);
  const [createCentroid, setCreateCentroid] = useState<[number, number]>(DEFAULT_CENTER);
  const [createRadius, setCreateRadius] = useState(0);

  // â"€â"€ Edit form state â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const [editForm, setEditForm] = useState({
    area_name: "",
    country_id: "",
    state_id: "",
    city_id: "",
    area_type_id: "",
    is_active: true,
  });
  const [editPolygon, setEditPolygon] = useState<PolygonCoords>([]);
  const [editCentroid, setEditCentroid] = useState<[number, number]>(DEFAULT_CENTER);
  const [editRadius, setEditRadius] = useState(0);
  // Key trick: remount the polygon picker when editing a different area
  const [pickerKey, setPickerKey] = useState(0);
  const [mapReferenceAreas, setMapReferenceAreas] = useState<AreaPoint[]>([]);
  const [mapAreasLoading, setMapAreasLoading] = useState(false);
  const [createMapFlyTo, setCreateMapFlyTo] = useState<MapFlyTo | null>(null);
  const [editMapFlyTo, setEditMapFlyTo] = useState<MapFlyTo | null>(null);

  const geoLabels = useRef({
    countries: new Map<string, string>(),
    states: new Map<string, string>(),
    cities: new Map<string, string>(),
  });

  const registerGeoOptions = (
    kind: "countries" | "states" | "cities",
    opts: { id?: string; label: string }[],
  ) => {
    const map = geoLabels.current[kind];
    map.clear();
    opts.forEach((o) => {
      if (o.id) map.set(String(o.id), o.label);
    });
  };

  const focusMapForGeography = useCallback(
    async (
      ids: { countryId?: string; stateId?: string; cityId?: string },
      setFly: (v: MapFlyTo | null) => void,
      nameHints?: { countryName?: string; stateName?: string; cityName?: string },
    ) => {
      const countryName =
        nameHints?.countryName ??
        (ids.countryId ? geoLabels.current.countries.get(String(ids.countryId)) : undefined);
      const stateName =
        nameHints?.stateName ??
        (ids.stateId ? geoLabels.current.states.get(String(ids.stateId)) : undefined);
      const cityName =
        nameHints?.cityName ??
        (ids.cityId ? geoLabels.current.cities.get(String(ids.cityId)) : undefined);

      if (!countryName && !stateName && !cityName) return;

      const fly = await resolveGeographyMapFlyTo(
        { countryName, stateName, cityName },
        mapReferenceAreas,
      );
      if (fly) setFly(fly);
    },
    [mapReferenceAreas],
  );

  const fetchMapReferenceAreas = useCallback(async () => {
    try {
      setMapAreasLoading(true);
      const res = await masterAPI.getAreas({ page: 1, limit: 500 });
      if (res?.status) setMapReferenceAreas(res.data || []);
    } catch {
      /* keep previous list */
    } finally {
      setMapAreasLoading(false);
    }
  }, []);

  // â"€â"€ Data fetch â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const fetchData = useCallback(async (overrides: any = {}) => {
    try {
      setLoading(true);
      const cityId = overrides.city_id ?? filterCityId;
      const res = await masterAPI.getAreas({
        page: overrides.page ?? page,
        limit: overrides.limit ?? limit,
        search: overrides.search ?? search,
        ...(cityId ? { city_id: cityId } : {}),
      });
      if (res.status && res.data) {
        setData(res.data);
        setTotal(res.pagination?.total ?? res.data.length);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [page, limit, search, filterCityId]);

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (openCreateForm || openEditForm) void fetchMapReferenceAreas();
  }, [openCreateForm, openEditForm, fetchMapReferenceAreas]);

  useEffect(() => {
    if (openCreateForm) setCreateMapFlyTo(null);
  }, [openCreateForm]);

  useEffect(() => {
    if (!openEditForm || !editRow) return;
    void focusMapForGeography(
      {
        countryId: editForm.country_id,
        stateId: editForm.state_id,
        cityId: editForm.city_id,
      },
      setEditMapFlyTo,
      {
        countryName: editRow.country_name,
        stateName: editRow.state_name,
        cityName: editRow.city_name,
      },
    );
  }, [openEditForm, editRow?.area_id, pickerKey, focusMapForGeography]);

  const showFailed = (msg: string) => {
    setFailedMsg(msg); setFailedOverlay(true);
    setTimeout(() => setFailedOverlay(false), 3000);
  };
  const showSuccess = (cb?: () => void) => {
    setSuccessOverlay(true);
    setTimeout(() => { setSuccessOverlay(false); cb?.(); fetchData(); }, 1800);
  };

  // â"€â"€ Handlers â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const handleToggle = async (newValue: boolean, row: any) => {
    try { await masterAPI.updateArea(row.area_id, { is_active: newValue }); fetchData(); }
    catch (e: any) { showFailed(e?.message || "Update failed."); }
  };

  const { handleBulkActivate, handleBulkDeactivate } = makeIsActiveBulkHandlers(
    (id, d) => masterAPI.updateArea(id, d),
    {
      onSuccess: () => { setSuccessOverlay(true); setTimeout(() => { setSuccessOverlay(false); fetchData(); }, 1500); },
      onError: () => { setFailedMsg("Unable to update status."); setFailedOverlay(true); setTimeout(() => setFailedOverlay(false), 3000); },
    }
  );

  const handleBulkDelete = async (ids: any[]) => {
    try {
      await Promise.all(ids.map((id) => masterAPI.deleteArea(id)));
      setSuccessOverlay(true);
      setTimeout(() => { setSuccessOverlay(false); fetchData(); }, 1500);
    } catch (e: any) { showFailed(e?.message || "Delete failed."); }
  };

  const handleDelete = (row: any) => { setDeleteId(row.area_id); setOpenDeleteModal(true); };
  const confirmDelete = async () => {
    try { await masterAPI.deleteArea(deleteId); setOpenDeleteModal(false); showSuccess(); }
    catch (e: any) { showFailed(e.message); }
  };

  const handleEdit = (row: any) => {
    setEditRow(row);
    const polygon: PolygonCoords = Array.isArray(row.polygon_coordinates) && row.polygon_coordinates.length >= 3
      ? row.polygon_coordinates
      : [];
    setEditPolygon(polygon);
    if (polygon.length >= 3) {
      const c: [number, number] = [
        polygon.reduce((s: number, p: number[]) => s + p[0], 0) / polygon.length,
        polygon.reduce((s: number, p: number[]) => s + p[1], 0) / polygon.length,
      ];
      setEditCentroid(c);
      setEditRadius(parseFloat(row.radius_km) || 0);
    } else {
      setEditCentroid([parseFloat(row.latitude) || DEFAULT_CENTER[0], parseFloat(row.longitude) || DEFAULT_CENTER[1]]);
      setEditRadius(0);
    }
    setEditForm({
      area_name: row.area_name,
      country_id: String(row.country_id || ""),
      state_id: String(row.state_id || ""),
      city_id: String(row.city_id || ""),
      area_type_id: row.area_type_id != null ? String(row.area_type_id) : "",
      is_active: row.is_active,
    });
    setPickerKey((k) => k + 1); // remount picker with fresh polygon
    setOpenEditForm(true);
  };

  const handleCreate = async () => {
    if (!createForm.area_name.trim()) { showFailed("Area name is required."); return; }
    if (!createForm.city_id) { showFailed("Please select a city."); return; }
    if (!createForm.area_type_id) { showFailed("Please select an area type."); return; }
    if (createPolygon.length < 3) { showFailed("Please draw a polygon on the map."); return; }
    try {
      const res = await masterAPI.createArea({
        area_name: createForm.area_name,
        city_id: parseInt(createForm.city_id),
        area_type_id: parseInt(createForm.area_type_id, 10),
        latitude: createCentroid[0],
        longitude: createCentroid[1],
        radius_km: parseFloat(createRadius.toFixed(2)),
        polygon_coordinates: createPolygon,
        is_active: createForm.is_active,
      });
      if (res.status) {
        showSuccess(() => {
          setOpenCreateForm(false);
          setCreateForm({ area_name: "", city_id: "", area_type_id: "", is_active: true });
          setSelectedCountry(""); setSelectedState("");
          setCreatePolygon([]); setCreateCentroid(DEFAULT_CENTER); setCreateRadius(0);
        });
      } else showFailed(res.message ?? "Failed to create area.");
    } catch (e: any) { showFailed(e.message); }
  };

  const handleSaveEdit = async () => {
    if (!editForm.area_name.trim()) { showFailed("Area name is required."); return; }
    if (!editForm.city_id) { showFailed("Please select a city."); return; }
    if (!editForm.area_type_id) { showFailed("Please select an area type."); return; }
    if (editPolygon.length < 3) { showFailed("Please draw a polygon on the map."); return; }
    setEditLoading(true);
    try {
      const res = await masterAPI.updateArea(editRow.area_id, {
        area_name: editForm.area_name,
        city_id: parseInt(editForm.city_id),
        area_type_id: parseInt(editForm.area_type_id, 10),
        latitude: editCentroid[0],
        longitude: editCentroid[1],
        radius_km: parseFloat(editRadius.toFixed(2)),
        polygon_coordinates: editPolygon,
        is_active: editForm.is_active,
      });
      if (res.status) showSuccess(() => { setOpenEditForm(false); setEditRow(null); });
      else showFailed(res.message ?? "Failed");
    } catch (e: any) { showFailed(e.message); } finally { setEditLoading(false); }
  };

  // ── Copy Setup handlers ──────────────────────────────────────────────────────
  const handleOpenCopy = (row: any) => {
    setCopySourceRow(row);
    setCopyTargetAreaId("");
    setCopyStats(null);
    void fetchMapReferenceAreas();
    setOpenCopyModal(true);
  };

  const handleConfirmCopy = async () => {
    if (!copyTargetAreaId) { showFailed("Please select a target area."); return; }
    if (String(copySourceRow?.area_id) === String(copyTargetAreaId)) {
      showFailed("Source and target areas must be different.");
      return;
    }
    setCopyLoading(true);
    try {
      const res = await adminAPI.copyAreaSetup({
        sourceAreaId: copySourceRow.area_id,
        targetAreaId: parseInt(copyTargetAreaId),
      });
      if (res?.status) {
        setCopyStats(res.stats ?? {});
      } else {
        showFailed(res?.message || "Copy failed.");
      }
    } catch (e: any) {
      showFailed(e.message || "Copy failed.");
    } finally {
      setCopyLoading(false);
    }
  };

  // â"€â"€ Render â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  return (
    <div className="space-y-6">

      <SuccessOverlay show={successOverlay} onFinish={() => setSuccessOverlay(false)} title="Success" subtitle="Area saved." />
      <FailedOverlay show={failedOverlay} title="Failed" subtitle={failedMsg} onFinish={() => setFailedOverlay(false)} />

      {/* â"€â"€ CREATE FORM â"€â"€ */}
      {openCreateForm && (
        <div className="bg-[#ffffff] rounded-2xl border border-[#f1f5f9] shadow-sm">
          <div className="px-6 pt-6 pb-4 border-b border-[#f1f5f9]">
            <h2 className="text-[15px] font-bold text-[#1e293b]">Add Area</h2>
            <p className="text-[12px] text-[#5c6a7f] mt-0.5">
              Select country, state, and city to zoom the map - or search a place - then draw the boundary in blue.
            </p>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] gap-6 p-4 sm:p-6">
            <div className="relative z-20 min-w-0">
              <LeafletPolygonPicker
                mapHeight={AREA_FORM_MAP_HEIGHT}
                mapFlyTo={createMapFlyTo}
                existingAreas={mapReferenceAreas}
                onPolygonChange={(poly, centroid, radius) => {
                  setCreatePolygon(poly);
                  setCreateCentroid(centroid);
                  setCreateRadius(radius);
                }}
              />
              {mapAreasLoading && (
                <p className="text-[11px] text-[#5c6a7f] mt-1">Loading existing areas on mapâ€¦</p>
              )}
              {createPolygon.length >= 3 && (
                <p className="text-[11px] text-[#5c6a7f] mt-1.5">
                  Centroid: {createCentroid[0].toFixed(5)}, {createCentroid[1].toFixed(5)} Â· Bounding radius: ~{createRadius.toFixed(2)} km
                </p>
              )}
            </div>

            <div className="flex flex-col gap-4 xl:max-h-[calc(72vh+140px)] xl:overflow-y-auto xl:pr-1">
              <div>
                <label className="text-[12px] font-semibold text-[#475569] block mb-1.5">
                  Area Name <span className="text-[#7b5757]">*</span>
                </label>
                <input
                  className="w-full px-3 py-2.5 rounded-xl border border-[#e2e8f0] text-[13px] focus:outline-none focus:border-[#60a5fa]"
                  placeholder="e.g. Koramangala"
                  value={createForm.area_name}
                  onChange={(e) => setCreateForm((p) => ({ ...p, area_name: e.target.value }))}
                />
              </div>

              <AsyncSelect
                name="country_id"
                title="Country"
                resource="countries"
                value={selectedCountry}
                onLoad={(opts) => registerGeoOptions("countries", opts)}
                onChange={(e: any) => {
                  const countryId = e.target.value;
                  setSelectedCountry(countryId);
                  setSelectedState("");
                  setCreateForm((p) => ({ ...p, city_id: "" }));
                  geoLabels.current.states.clear();
                  geoLabels.current.cities.clear();
                  void focusMapForGeography({ countryId }, setCreateMapFlyTo);
                }}
              />
              <AsyncSelect
                name="state_id"
                title="State"
                resource="states"
                filters={selectedCountry ? { country_id: selectedCountry } : {}}
                disabled={!selectedCountry}
                value={selectedState}
                onLoad={(opts) => registerGeoOptions("states", opts)}
                onChange={(e: any) => {
                  const stateId = e.target.value;
                  setSelectedState(stateId);
                  setCreateForm((p) => ({ ...p, city_id: "" }));
                  geoLabels.current.cities.clear();
                  void focusMapForGeography(
                    { countryId: selectedCountry, stateId },
                    setCreateMapFlyTo,
                  );
                }}
              />
              <AsyncSelect
                name="city_id"
                title="City"
                resource="cities"
                filters={selectedState ? { state_id: selectedState } : {}}
                disabled={!selectedState}
                value={createForm.city_id}
                onLoad={(opts) => registerGeoOptions("cities", opts)}
                onChange={(e: any) => {
                  const cityId = e.target.value;
                  setCreateForm((p) => ({ ...p, city_id: cityId }));
                  void focusMapForGeography(
                    { countryId: selectedCountry, stateId: selectedState, cityId },
                    setCreateMapFlyTo,
                  );
                }}
                required
              />

              <AsyncSelect
                name="area_type_id"
                title="Area Type"
                resource="area-types"
                apiType="lookup"
                labelKey="area_type"
                valueKey="area_type_id"
                filters={{ is_active: true }}
                value={createForm.area_type_id}
                onChange={(e: any) => setCreateForm((p) => ({ ...p, area_type_id: e.target.value }))}
                required
              />

              <div>
                <label className="text-[12px] font-semibold text-[#475569] block mb-1.5">Status</label>
                <Toggle name="is_active" title="Status" checked={createForm.is_active}
                  onChange={(v) => setCreateForm((p) => ({ ...p, is_active: v }))} />
              </div>

              <div className="flex gap-2.5 pt-2 xl:sticky xl:bottom-0 xl:bg-[#ffffff] xl:pb-1">
                <button type="button" onClick={handleCreate}
                  className="flex-1 px-5 py-2.5 rounded-xl bg-[#2563eb] text-[#ffffff] font-semibold text-[13px] hover:bg-[#1d4ed8] transition-colors">
                  Create Area
                </button>
                <button type="button" onClick={() => setOpenCreateForm(false)}
                  className="px-5 py-2.5 rounded-xl bg-[#f1f5f9] font-semibold text-[13px]">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* â"€â"€ EDIT FORM â"€â"€ */}
      {openEditForm && editRow && (
        <div className="bg-[#ffffff] rounded-2xl border border-[#f1f5f9] shadow-sm">
          <div className="px-6 pt-6 pb-4 border-b border-[#f1f5f9]">
            <h2 className="text-[15px] font-bold text-[#1e293b]">Edit Area</h2>
            <p className="text-[12px] text-[#5c6a7f] mt-0.5">
              Editing: <strong>{editRow.area_name}</strong> - other areas shown as dashed grey reference shapes.
            </p>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] gap-6 p-4 sm:p-6">
            <div className="relative z-20 min-w-0">
              <LeafletPolygonPicker
                key={pickerKey}
                mapHeight={AREA_FORM_MAP_HEIGHT}
                mapFlyTo={editMapFlyTo}
                initialPolygon={editPolygon.length >= 3 ? editPolygon : undefined}
                existingAreas={mapReferenceAreas}
                excludeAreaId={editRow.area_id}
                onPolygonChange={(poly, centroid, radius) => {
                  setEditPolygon(poly);
                  setEditCentroid(centroid);
                  setEditRadius(radius);
                }}
              />
              {mapAreasLoading && (
                <p className="text-[11px] text-[#5c6a7f] mt-1">Loading existing areas on mapâ€¦</p>
              )}
              {editPolygon.length >= 3 && (
                <p className="text-[11px] text-[#5c6a7f] mt-1.5">
                  Centroid: {editCentroid[0].toFixed(5)}, {editCentroid[1].toFixed(5)} Â· Bounding radius: ~{editRadius.toFixed(2)} km
                </p>
              )}
            </div>

            <div className="flex flex-col gap-4 xl:max-h-[calc(72vh+140px)] xl:overflow-y-auto xl:pr-1">
              <div>
                <label className="text-[12px] font-semibold text-[#475569] block mb-1.5">Area Name</label>
                <input className="w-full px-3 py-2.5 rounded-xl border border-[#e2e8f0] text-[13px] focus:outline-none focus:border-[#60a5fa]"
                  value={editForm.area_name}
                  onChange={(e) => setEditForm((p) => ({ ...p, area_name: e.target.value }))} />
              </div>

              <AsyncSelect
                name="edit_country_id"
                title="Country"
                resource="countries"
                value={editForm.country_id}
                onLoad={(opts) => registerGeoOptions("countries", opts)}
                onChange={(e: any) => {
                  const countryId = e.target.value;
                  setEditForm((p) => ({ ...p, country_id: countryId, state_id: "", city_id: "" }));
                  geoLabels.current.states.clear();
                  geoLabels.current.cities.clear();
                  void focusMapForGeography({ countryId }, setEditMapFlyTo);
                }}
              />
              <AsyncSelect
                name="edit_state_id"
                title="State"
                resource="states"
                filters={editForm.country_id ? { country_id: editForm.country_id } : {}}
                disabled={!editForm.country_id}
                value={editForm.state_id}
                onLoad={(opts) => registerGeoOptions("states", opts)}
                onChange={(e: any) => {
                  const stateId = e.target.value;
                  setEditForm((p) => ({ ...p, state_id: stateId, city_id: "" }));
                  geoLabels.current.cities.clear();
                  void focusMapForGeography(
                    { countryId: editForm.country_id, stateId },
                    setEditMapFlyTo,
                  );
                }}
              />
              <AsyncSelect
                name="edit_city_id"
                title="City"
                resource="cities"
                filters={editForm.state_id ? { state_id: editForm.state_id } : {}}
                disabled={!editForm.state_id}
                value={editForm.city_id}
                onLoad={(opts) => registerGeoOptions("cities", opts)}
                onChange={(e: any) => {
                  const cityId = e.target.value;
                  setEditForm((p) => ({ ...p, city_id: cityId }));
                  void focusMapForGeography(
                    {
                      countryId: editForm.country_id,
                      stateId: editForm.state_id,
                      cityId,
                    },
                    setEditMapFlyTo,
                  );
                }}
              />

              <AsyncSelect
                name="edit_area_type_id"
                title="Area Type"
                resource="area-types"
                apiType="lookup"
                labelKey="area_type"
                valueKey="area_type_id"
                filters={{ is_active: true }}
                value={editForm.area_type_id}
                onChange={(e: any) => setEditForm((p) => ({ ...p, area_type_id: e.target.value }))}
                required
              />

              <div>
                <label className="text-[12px] font-semibold text-[#475569] block mb-1.5">Status</label>
                <Toggle name="is_active" title="Status" checked={editForm.is_active}
                  onChange={(v) => setEditForm((p) => ({ ...p, is_active: v }))} />
              </div>

              <div className="flex gap-2.5 pt-2 xl:sticky xl:bottom-0 xl:bg-[#ffffff] xl:pb-1">
                <button type="button" onClick={handleSaveEdit} disabled={editLoading}
                  className="flex-1 px-5 py-2.5 rounded-xl bg-[#2563eb] text-[#ffffff] font-semibold text-[13px] hover:bg-[#1d4ed8] transition-colors disabled:opacity-60">
                  {editLoading ? "Savingâ€¦" : "Save Changes"}
                </button>
                <button type="button" onClick={() => { setOpenEditForm(false); setEditRow(null); }}
                  className="px-5 py-2.5 rounded-xl bg-[#f1f5f9] font-semibold text-[13px]">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* â"€â"€ TABLE â"€â"€ */}
      <PaginatedTable
        showMe={!openCreateForm && !openEditForm}
        headerActions={
          <button type="button" onClick={() => router.push("/admin/masters/geography/areas/map")}
            className="cursor-pointer inline-flex items-center gap-2 px-3 py-1 text-xs rounded-lg transition-all border active:bg-[#e2e8f0] text-[#475569] hover:text-[#0f172a] hover:bg-[#f1f5f9] border-[#e2e8f0] hover:border-[#e2e8f0]">
            <MapIcon className="w-3.5 h-3.5" />View on Map
          </button>
        }
        title="Areas" badge="Masters" subtitle={`${total} areas found`}
        data={data} total={total} loading={loading} page={page} limit={limit}
        onPageChange={(p: number) => { setPage(p); fetchData({ page: p }); }}
        onLimitChange={(l: number) => { setLimit(l); fetchData({ limit: l, page: 1 }); }}
        onSort={() => {}} onSearch={(v: string) => { setSearch(v); fetchData({ search: v, page: 1 }); }}
        searchValue={search}
        showSearch showFilter showExport showAdd showRefresh addLabel="Add Area"
        onAdd={() => { setOpenCreateForm(true); void fetchMapReferenceAreas(); }} onRefresh={() => fetchData()} rowKey="area_id"
      >
        <Filters>
          <DropdownFilter
            value={filterCountryId}
            onChange={(v: string) => {
              setFilterCountryId(v);
              setFilterStateId("");
              setFilterCityId("");
              setPage(1);
              fetchData({ page: 1, city_id: "" });
            }}
            placeholder="All Countries"
            options={geoOptions.countries}
          />
          <DropdownFilter
            value={filterStateId}
            onChange={(v: string) => {
              setFilterStateId(v);
              setFilterCityId("");
              setPage(1);
              fetchData({ page: 1, city_id: "" });
            }}
            placeholder="All States"
            options={geoOptions.states}
          />
          <DropdownFilter
            value={filterCityId}
            onChange={(v: string) => {
              setFilterCityId(v);
              setPage(1);
              fetchData({ page: 1, city_id: v });
            }}
            placeholder="All Cities"
            options={geoOptions.cities}
          />
        </Filters>
        <Column header="SL" type="serial" />
        <Column header="Area Name" dataKey="area_name" sortable />
        <Column header="Area Type" dataKey="area_type_name" sortable
          render={(v: string) => v || "-"} />
        <Column header="Country" dataKey="country_name" sortable />
        <Column header="State" dataKey="state_name" sortable />
        <Column header="City" dataKey="city_name" sortable />
        <Column header="Boundary" dataKey="polygon_coordinates"
          render={(v: any) => v
            ? <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#f5f3ff] text-[#6d28d9] border border-[#ddd6fe]">Polygon</span>
            : <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]">Circle</span>}
        />
        <Column header="Radius" dataKey="radius_km" render={(v: any, row: any) =>
          row.polygon_coordinates ? `~${v ?? "-"} km` : v ? `${v} km` : "N/A"} sortable />
        <Column header="Lat / Lng" dataKey="latitude" render={(_: any, row: any) =>
          `${parseFloat(row.latitude).toFixed(4)}, ${parseFloat(row.longitude).toFixed(4)}`} />
        <Column header="Status" dataKey="is_active" type="toggle" onToggle={handleToggle} />
        <Column header="Action" dataKey="_actions" type="actions" align="right"
          actions={buildBulkCrudActions({
            onEdit: handleEdit,
            onActivateRow: (row) => { void handleToggle(true, row); },
            onDeactivateRow: (row) => { void handleToggle(false, row); },
            onBulkActivate: handleBulkActivate,
            onBulkDeactivate: handleBulkDeactivate,
            onDeleteRow: handleDelete,
            onBulkDelete: handleBulkDelete,
            extra: [
              { label: "Copy Setup", icon: Copy, onClick: handleOpenCopy },
            ],
          })}
        />
      </PaginatedTable>

      <Modal openModal={openDeleteModal} setOpenModal={setOpenDeleteModal}>
        <div className="p-2 bg-[#ffffff] rounded-2xl w-full max-w-sm mx-auto text-center">
          <div className="w-12 h-12 bg-[#fef2f2] rounded-xl flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-6 h-6 text-[#7b5757]" />
          </div>
          <h2 className="text-[16px] font-bold">Delete Area?</h2>
          <p className="text-[12px] text-[#5c6a7f] mt-2">This will permanently delete the area. Are you sure?</p>
          <div className="mt-6 flex gap-2.5">
            <button onClick={() => setOpenDeleteModal(false)} className="flex-1 py-2.5 rounded-xl bg-[#f1f5f9] font-semibold text-[13px]">Cancel</button>
            <button onClick={confirmDelete} className="flex-1 py-2.5 rounded-xl bg-[#fef2f2] text-[#ffffff] font-semibold text-[13px]">Delete Permanent</button>
          </div>
        </div>
      </Modal>

      {/* ── COPY SETUP MODAL ── */}
      <Modal openModal={openCopyModal} setOpenModal={(v) => { if (!copyLoading) setOpenCopyModal(v); }}>
        <div className="bg-[#ffffff] rounded-2xl w-full max-w-md mx-auto overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-[#f1f5f9] px-5 py-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eff6ff]">
              <Copy className="h-4 w-4 text-[#2563eb]" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[#1e293b]">Copy Area Setup</h2>
              <p className="text-[11.5px] text-[#64748b]">Duplicate configuration from one area to another</p>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {copyStats ? (
              /* ── Success state ── */
              <div className="space-y-4">
                <div className="flex flex-col items-center gap-2 py-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ecfdf5]">
                    <CheckCircle className="h-6 w-6 text-[#16a34a]" />
                  </div>
                  <p className="text-[14px] font-bold text-[#1e293b]">Setup copied successfully!</p>
                  <p className="text-[12px] text-[#64748b]">
                    From <span className="font-semibold text-[#1e293b]">{copySourceRow?.area_name}</span>
                  </p>
                </div>
                <div className="rounded-xl border border-[#e2e8f0] divide-y divide-[#f1f5f9]">
                  {[
                    { label: "Service Categories", key: "categories" },
                    { label: "Services", key: "services" },
                    { label: "Time Slots", key: "slots" },
                    { label: "Booking Types", key: "bookingTypes" },
                    { label: "Units & Pricing", key: "units" },
                    { label: "Pricing Rules", key: "pricing" },
                  ].map(({ label, key }) => (
                    <div key={key} className="flex items-center justify-between px-3.5 py-2.5">
                      <span className="text-[12.5px] text-[#475569]">{label}</span>
                      <span className={`text-[12.5px] font-bold ${(copyStats[key] ?? 0) > 0 ? "text-[#16a34a]" : "text-[#94a3b8]"}`}>
                        {(copyStats[key] ?? 0) > 0 ? `+${copyStats[key]} copied` : "already exists / none"}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setOpenCopyModal(false)}
                  className="w-full py-2.5 rounded-xl bg-[#2563eb] text-white font-semibold text-[13px] hover:bg-[#1d4ed8]"
                >
                  Done
                </button>
              </div>
            ) : (
              /* ── Form state ── */
              <>
                {/* Source → Target */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5">
                    <p className="text-[10.5px] font-semibold uppercase tracking-wide text-[#94a3b8]">Source (copy from)</p>
                    <p className="mt-0.5 text-[13px] font-bold text-[#1e293b] truncate">{copySourceRow?.area_name}</p>
                    <p className="text-[11px] text-[#64748b]">{copySourceRow?.city_name}</p>
                  </div>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eff6ff]">
                    <Copy className="h-3.5 w-3.5 text-[#2563eb]" />
                  </div>
                  <div className="flex-1">
                    <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-[#94a3b8]">Target (copy to)</p>
                    <select
                      value={copyTargetAreaId}
                      onChange={(e) => setCopyTargetAreaId(e.target.value)}
                      className="w-full rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 text-[13px] font-semibold text-[#1e293b] outline-none focus:border-[#60a5fa]"
                    >
                      <option value="">Select area…</option>
                      {mapReferenceAreas
                        .filter((a: any) => String(a.area_id) !== String(copySourceRow?.area_id))
                        .map((a: any) => (
                          <option key={a.area_id} value={a.area_id}>
                            {a.area_name}{a.city_name ? ` — ${a.city_name}` : ""}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* What will be copied */}
                <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3.5">
                  <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-[#64748b]">What gets copied</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {["Service Categories", "Services", "Time Slots", "Booking Types", "Units & Pricing", "Pricing Rules"].map((item) => (
                      <div key={item} className="flex items-center gap-1.5 text-[12px] text-[#475569]">
                        <CheckCircle className="h-3.5 w-3.5 shrink-0 text-[#16a34a]" />
                        {item}
                      </div>
                    ))}
                  </div>
                  <p className="mt-2.5 text-[11px] text-[#94a3b8]">
                    Existing config in the target area is preserved (no overwrites).
                  </p>
                </div>

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setOpenCopyModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-[#f1f5f9] font-semibold text-[13px] text-[#475569]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!copyTargetAreaId || copyLoading}
                    onClick={handleConfirmCopy}
                    className="flex-1 py-2.5 rounded-xl bg-[#2563eb] text-white font-semibold text-[13px] hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {copyLoading ? "Copying…" : "Copy Setup"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

