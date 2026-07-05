"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import { Copy, Upload, Download, FileSpreadsheet, Plus, Clock } from "lucide-react";
import PaginatedTable, { Column, Filters, DropdownFilter, ToggleFilter } from "@/app/admin/(components)/Table";
import { useGeographyFilterOptions } from "@/app/admin/(lib)/tableFilters";
import { buildBulkCrudActions, makeIsActiveBulkHandlers } from "@/app/admin/(lib)/bulkCrudActions";
import { masterAPI } from "@/lib/api";
import Modal from "@/components/modals/Modal";
import Input from "@/app/admin/(components)/Forms/Input";
import Toggle from "@/app/admin/(components)/Forms/Toggle";
import Form from "@/app/admin/(components)/Forms/Form";
import SuccessOverlay from "@/app/admin/(components)/Overlay/Successoverlay";
import FailedOverlay from "@/app/admin/(components)/Overlay/Failedoverlay";
import AsyncSelect from "@/app/admin/(components)/Forms/AsyncSelect";
// â"€â"€ Shape of a single time-slot record in the form â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
const emptyRecord = {
  name: "",
  start_time: "",
  end_time: "",
  area_id: "",
  area_label: "",
  service_id: "",
  service_label: "",
  surge_multiplier: "1",
  max_capacity: "",
  is_instant: false,
  is_active: true,
};
type SlotRecord = typeof emptyRecord;

export default function TimeSlotsPage() {
  const resource = "time-slots";

  // â"€â"€ Table state â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const [data,    setData]    = useState<any[]>([]);
  const [page,    setPage]    = useState(1);
  const [limit,   setLimit]   = useState(10);
  const [total,   setTotal]   = useState(0);
  const [search,  setSearch]  = useState("");
  const [loading, setLoading] = useState(false);
  const [filterCountryId, setFilterCountryId] = useState("");
  const [filterStateId, setFilterStateId] = useState("");
  const [filterCityId, setFilterCityId] = useState("");
  const [filterAreaId, setFilterAreaId] = useState("");
  const [filterServiceId, setFilterServiceId] = useState("");
  const [filterInstantOnly, setFilterInstantOnly] = useState(false);
  const [filterActiveOnly, setFilterActiveOnly] = useState(false);
  const [serviceFilterOptions, setServiceFilterOptions] = useState<{ value: string; label: string }[]>([]);
  const geoOptions = useGeographyFilterOptions(filterCountryId, filterStateId, filterCityId);

  // â"€â"€ Overlay state â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const [successOverlay, setSuccessOverlay] = useState(false);
  const [failedOverlay,  setFailedOverlay]  = useState(false);
  const [failedMsg,      setFailedMsg]      = useState("Unable to save changes.");

  // â"€â"€ Form open/close â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const [openCreateForm, setOpenCreateForm] = useState(false);
  const [openEditForm,   setOpenEditForm]   = useState(false);
  const [editRow,        setEditRow]        = useState<any>(null);
  const [editLoading,    setEditLoading]    = useState(false);

  // â"€â"€ Deactivate modal â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const [openDeactivateModal, setOpenDeactivateModal] = useState(false);
  const [toggleRecordId,      setToggleRecordId]      = useState<any>(null);

  // â"€â"€ Bulk Excel upload modal â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const [openBulkModal, setOpenBulkModal] = useState(false);
  const [bulkFile,      setBulkFile]      = useState<File | null>(null);
  const [bulkLoading,   setBulkLoading]   = useState(false);
  const [bulkResult,    setBulkResult]    = useState<{
    success: number; failed: number; errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // â"€â"€ Cascade selects for create form â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const [createCountry, setCreateCountry] = useState("");
  const [createState,   setCreateState]   = useState("");
  const [createCity,    setCreateCity]    = useState("");

  // â"€â"€ Cascade selects for edit form â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const [editCountry, setEditCountry] = useState("");
  const [editState,   setEditState]   = useState("");
  const [editCity,    setEditCity]    = useState("");

  // â"€â"€ Form data â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const [createForm, setCreateForm] = useState<SlotRecord>({ ...emptyRecord });
  const [editForm,   setEditForm]   = useState<SlotRecord>({ ...emptyRecord });

  // â"€â"€ Helpers â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const showFailed = (msg: string) => {
    setFailedMsg(msg);
    setFailedOverlay(true);
    setTimeout(() => setFailedOverlay(false), 3000);
  };

  const applyServiceSelection = (
    serviceId: string,
    setter: (fn: (p: any) => any) => void,
    serviceLabel?: string
  ) => {
    setter((p) => ({
      ...p,
      service_id: serviceId,
      service_label: serviceLabel ?? "",
    }));
  };

  const resetCreateForm = () => {
    setCreateForm({ ...emptyRecord });
    setCreateCountry(""); setCreateState(""); setCreateCity("");
  };

  // â"€â"€ Data fetch â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const fetchData = useCallback(async (overrides: any = {}) => {
    try {
      setLoading(true);
      const areaId = overrides.area_id ?? filterAreaId;
      const serviceId = overrides.service_id ?? filterServiceId;
      const instantOnly = overrides.is_instant ?? (filterInstantOnly ? true : undefined);
      const activeOnly = overrides.is_active ?? (filterActiveOnly ? true : undefined);
      const res = await masterAPI.getLookups(resource, {
        page:   overrides.page   ?? page,
        limit:  overrides.limit  ?? limit,
        search: overrides.search ?? search,
        ...(areaId ? { area_id: areaId } : {}),
        ...(serviceId ? { service_id: serviceId } : {}),
        ...(instantOnly ? { is_instant: true } : {}),
        ...(activeOnly ? { is_active: true } : {}),
      });
      if (res.status && res.data) {
        // Active records first, deactivated always at bottom
        const sorted = [...res.data].sort(
          (a: any, b: any) => (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0)
        );
        setData(sorted);
        setTotal(res.pagination?.total ?? sorted.length);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, limit, search, filterAreaId, filterServiceId, filterInstantOnly, filterActiveOnly]);

  useEffect(() => {
    fetchData();
    masterAPI.getLookups("services", { limit: "all" }).then((res: any) => {
      if (res?.data) {
        setServiceFilterOptions(
          res.data.map((s: any) => ({
            value: String(s.service_id),
            label: s.service ?? `Service #${s.service_id}`,
          }))
        );
      }
    });
  }, []);

  // â"€â"€ Handlers â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const handleToggle = async (newValue: boolean, row: any) => {
    try {
      if (newValue) {
        await masterAPI.updateLookup(resource, row.slot_id, { is_active: true });
        fetchData();
      } else {
        setToggleRecordId(row.slot_id);
        setOpenDeactivateModal(true);
      }
    } catch {}
  };

  const deactivateRecord = async () => {
    try {
      await masterAPI.updateLookup(resource, toggleRecordId, { is_active: false });
      setOpenDeactivateModal(false);
      fetchData();
    } catch {}
  };

  const { handleBulkActivate, handleBulkDeactivate } = makeIsActiveBulkHandlers(
    (id, d) => masterAPI.updateLookup(resource, id, d),
    {
      onSuccess: () => { setSuccessOverlay(true); setTimeout(() => { setSuccessOverlay(false); fetchData(); }, 1500); },
      onError:   () => { setFailedMsg("Unable to update status."); setFailedOverlay(true); setTimeout(() => setFailedOverlay(false), 3000); },
    }
  );

  // Build payload from flat form state
  const buildPayload = (form: SlotRecord, extraFlags?: object) => ({
    name:             form.name,
    start_time:       form.start_time,
    end_time:         form.end_time,
    area_id:          form.area_id,
    service_id:       form.service_id,
    surge_multiplier: form.surge_multiplier ? Number(form.surge_multiplier) : 1,
    max_capacity:     form.max_capacity ? Number(form.max_capacity) : null,
    is_instant:       Boolean(form.is_instant),
    is_active:        form.is_active,
    ...extraFlags,
  });

  const validateForm = (form: SlotRecord) => {
    if (!form.name.trim())    { showFailed("Slot name is required.");   return false; }
    if (!form.area_id)        { showFailed("Please select an area.");   return false; }
    if (!form.service_id)     { showFailed("Please select a service."); return false; }
    if (!form.start_time)     { showFailed("Start time is required.");  return false; }
    if (!form.end_time)       { showFailed("End time is required.");    return false; }
    return true;
  };

  const handleCreateSubmit = async () => {
    if (!validateForm(createForm)) return;
    try {
      const res = await masterAPI.createLookup(resource, buildPayload(createForm));
      if (res?.status) {
        setSuccessOverlay(true);
        setTimeout(() => {
          setSuccessOverlay(false); setOpenCreateForm(false); resetCreateForm(); fetchData();
        }, 1800);
      } else showFailed(res?.message ?? "Failed to create.");
    } catch (err: any) { showFailed(err?.message || "Failed to create."); }
  };

  // Resolves country/state/city for an area_id, then sets all three cascade
  // dropdowns in ONE batched update so React processes them in a single render.
  //
  // The time-slots list only carries area_id. The area record stores city_id
  // directly; state_id lives on the city, country_id lives on the state.
  // Strategy:
  //  1. Fetch area  â†' get city_id (+ state_id/country_id if the server already joins them)
  //  2. Fetch city  â†' get state_id   (only if step 1 didn't provide it)
  //  3. Fetch state â†' get country_id (only if step 2 didn't provide it)
  // All three setters are called together at the end so the cascade selects
  // all re-render simultaneously with their correct filter values.
  const resolveAreaCascade = async (
    areaId: string,
    setCountry: (v: string) => void,
    setState:   (v: string) => void,
    setCity:    (v: string) => void,
  ) => {
    if (!areaId) return;
    try {
      let cityId = "", stateId = "", countryId = "";

      // Step 1 - area
      const areaRes = await masterAPI.getLookupById("areas", areaId);
      const area    = areaRes?.data ?? areaRes;
      if (!area) return;
      cityId    = String(area.city_id    || "");
      stateId   = String(area.state_id   || "");
      countryId = String(area.country_id || "");

      if (!cityId) return;

      // Step 2 - city (only if server didn't join state_id onto the area)
      if (!stateId) {
        const cityRes  = await masterAPI.getLookupById("cities", cityId);
        const city     = cityRes?.data ?? cityRes;
        stateId        = String(city?.state_id || "");
      }
      if (!stateId) return;

      // Step 3 - state (only if server didn't join country_id onto the area)
      if (!countryId) {
        const stateRes = await masterAPI.getLookupById("states", stateId);
        const st       = stateRes?.data ?? stateRes;
        countryId      = String(st?.country_id || "");
      }
      if (!countryId) return;

      // Single batched update - all three cascade dropdowns re-render at once
      setCity(cityId);
      setState(stateId);
      setCountry(countryId);
    } catch { /* cascade stays empty - user can pick manually */ }
  };

  const handleEdit = (row: any) => {
    setEditRow(row);
    setEditForm({
      name:          row.name         || "",
      start_time:    row.start_time   || "",
      end_time:      row.end_time     || "",
      area_id:       String(row.area_id    || ""),
      area_label:    row.area_name    || "",
      service_id:    String(row.service_id || ""),
      service_label: row.service      || "",
      surge_multiplier: String(row.surge_multiplier ?? "1"),
      max_capacity:     row.max_capacity != null ? String(row.max_capacity) : "",
      is_instant:       row.is_instant || false,
      is_active:        row.is_active,
    });
    // Reset cascade first, then resolve from the area record
    setEditCountry(""); setEditState(""); setEditCity("");
    void resolveAreaCascade(String(row.area_id || ""), setEditCountry, setEditState, setEditCity);
    setOpenEditForm(true);
  };

  const handleUpdateSubmit = async () => {
    if (!validateForm(editForm)) return;
    setEditLoading(true);
    try {
      const res = await masterAPI.updateLookup(resource, editRow.slot_id, buildPayload(editForm));
      if (res?.status) {
        setSuccessOverlay(true);
        setTimeout(() => {
          setSuccessOverlay(false); setOpenEditForm(false); setEditRow(null); fetchData();
        }, 1800);
      } else showFailed(res?.message ?? "Failed to update.");
    } catch (err: any) { showFailed(err?.message || "Failed to update."); }
    finally { setEditLoading(false); }
  };

  // Pre-fills the Add form with an existing row's data, then opens it.
  const handleCopy = (row: any) => {
    setCreateForm({
      name:          row.name         || "",
      start_time:    row.start_time   || "",
      end_time:      row.end_time     || "",
      area_id:       String(row.area_id    || ""),
      area_label:    row.area_name    || "",
      service_id:    String(row.service_id || ""),
      service_label: row.service      || "",
      surge_multiplier: String(row.surge_multiplier ?? "1"),
      max_capacity:     row.max_capacity != null ? String(row.max_capacity) : "",
      is_instant:       row.is_instant || false,
      is_active:        true,
    });
    // Reset cascade first, then resolve from the area record
    setCreateCountry(""); setCreateState(""); setCreateCity("");
    void resolveAreaCascade(String(row.area_id || ""), setCreateCountry, setCreateState, setCreateCity);
    setOpenEditForm(false);
    setOpenCreateForm(true);
  };

  // â"€â"€ Excel template download â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const exportTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      [
        "slot_name", "start_time", "end_time",
        "area_id", "service_id", "surge_multiplier", "max_capacity",
        "is_instant", "is_active",
      ],
      [
        "Morning Slot", "09:00", "12:00",
        1, 2, 1.0, 10,
        "FALSE", "TRUE",
      ],
    ]);
    // Column width hints
    ws["!cols"] = [
      { wch: 20 }, { wch: 12 }, { wch: 12 },
      { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 12 },
      { wch: 12 }, { wch: 12 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "TimeSlots");
    XLSX.writeFile(wb, "time_slots_template.xlsx");
  };

  // â"€â"€ Excel bulk upload â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const handleBulkUpload = async () => {
    if (!bulkFile) return;
    setBulkLoading(true);
    setBulkResult(null);
    const errors: string[] = [];
    let success = 0;
    try {
      const buf  = await bulkFile.arrayBuffer();
      const wb   = XLSX.read(buf);
      const ws   = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(ws);

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const rowNum = i + 2; // 1-indexed + header row
        try {
          const res = await masterAPI.createLookup(resource, {
            name:             r.slot_name || r.name || "",
            start_time:       r.start_time || "",
            end_time:         r.end_time   || "",
            area_id:          r.area_id,
            service_id:       r.service_id,
            surge_multiplier: r.surge_multiplier != null && r.surge_multiplier !== "" ? Number(r.surge_multiplier) : 1,
            max_capacity:     r.max_capacity != null && r.max_capacity !== "" ? Number(r.max_capacity) : null,
            is_instant:       String(r.is_instant ?? "").toUpperCase() === "TRUE",
            is_active:        String(r.is_active  ?? "TRUE").toUpperCase() !== "FALSE",
          });
          if (res?.status) success++;
          else errors.push(`Row ${rowNum}: ${res?.message || "Failed"}`);
        } catch (err: any) {
          errors.push(`Row ${rowNum}: ${err?.message || "Error"}`);
        }
      }
    } catch {
      errors.push("Could not parse the file. Make sure it is a valid .xlsx file.");
    }
    setBulkResult({ success, failed: errors.length, errors });
    setBulkLoading(false);
    if (success > 0) fetchData();
  };

  // â"€â"€ Shared form body (used by both Add and Edit) â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  const SlotFormFields = ({
    form,
    setForm,
    country, setCountry,
    state,   setState,
    city,    setCity,
    prefix,
  }: {
    form: SlotRecord;
    setForm: (fn: (p: SlotRecord) => SlotRecord) => void;
    country: string; setCountry: (v: string) => void;
    state:   string; setState:   (v: string) => void;
    city:    string; setCity:    (v: string) => void;
    prefix:  string;
  }) => (
    <>
      <Input
        name={`${prefix}_name`} title="Slot Name" required
        placeholder="e.g. 10 AM - 12 PM"
        value={form.name}
        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
      />
      {/* Start / End time side-by-side in one grid cell */}
      <div className="flex gap-3">
        <Input
          name={`${prefix}_start_time`} title="Start Time" required type="time"
          value={form.start_time}
          onChange={(e) => setForm((p) => ({ ...p, start_time: e.target.value }))}
        />
        <Input
          name={`${prefix}_end_time`} title="End Time" required type="time"
          value={form.end_time}
          onChange={(e) => setForm((p) => ({ ...p, end_time: e.target.value }))}
        />
      </div>

      {/* â"€â"€ Area cascade â"€â"€ */}
      <AsyncSelect
        name={`${prefix}_country`} title="Country" resource="countries"
        value={country}
        onChange={(e: any) => {
          setCountry(e.target.value);
          setState(""); setCity("");
          setForm((p) => ({ ...p, area_id: "", area_label: "" }));
        }}
      />
      <AsyncSelect
        name={`${prefix}_state`} title="State" resource="states"
        filters={country ? { country_id: country } : {}}
        disabled={!country}
        value={state}
        onChange={(e: any) => {
          setState(e.target.value);
          setCity("");
          setForm((p) => ({ ...p, area_id: "", area_label: "" }));
        }}
      />
      <AsyncSelect
        name={`${prefix}_city`} title="City" resource="cities"
        filters={state ? { state_id: state } : {}}
        disabled={!state}
        value={city}
        onChange={(e: any) => {
          setCity(e.target.value);
          setForm((p) => ({ ...p, area_id: "", area_label: "" }));
        }}
      />
      <AsyncSelect
        name={`${prefix}_area`} title="Area" resource="areas"
        filters={city ? { city_id: city } : {}}
        disabled={!city}
        value={form.area_id}
        onChange={(e: any) => setForm((p) => ({
          ...p,
          area_id:    e.target.value,
          area_label: e.target.options?.[e.target.selectedIndex]?.text || e.target.value,
        }))}
      />

      <AsyncSelect
        name={`${prefix}_service`} title="Service" resource="services" labelKey="service"
        value={form.service_id}
        onChange={(e: any) => {
          const id    = e.target.value;
          const label = e.target.options?.[e.target.selectedIndex]?.text || id;
          applyServiceSelection(id, setForm as any, label);
        }}
      />
      <Input
        name={`${prefix}_surge`} title="Surge multiplier (1.0 = normal)" type="number" step="0.01" min="0.1"
        value={form.surge_multiplier}
        onChange={(e) => setForm((p) => ({ ...p, surge_multiplier: e.target.value }))}
      />
      <Input
        name={`${prefix}_capacity`} title="Max capacity (optional)" type="number" min="1"
        value={form.max_capacity}
        onChange={(e) => setForm((p) => ({ ...p, max_capacity: e.target.value }))}
      />
      <Toggle
        name={`${prefix}_is_instant`} title="Is Instant"
        checked={form.is_instant}
        onChange={(v) => setForm((p) => ({ ...p, is_instant: v }))}
      />
    </>
  );

  // â"€â"€ Render â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€â"€
  return (
    <div className="space-y-6">

      <SuccessOverlay show={successOverlay} onFinish={() => setSuccessOverlay(false)} title="Success" subtitle="Saved successfully." />
      <FailedOverlay  show={failedOverlay}  onFinish={() => setFailedOverlay(false)}  title="Failed"  subtitle={failedMsg} />

      {/* â"€â"€ ADD FORM â"€â"€ */}
      <Form
        showMe={openCreateForm}
        cols={2} card
        title="Add Time Slot"
        subtitle="Define when a service can be booked in an area (pricing is configured under Area Ã— Service mapping)"
        onSubmit={handleCreateSubmit}
        onReset={() => { setOpenCreateForm(false); resetCreateForm(); }}
        submitLabel="Create"
        showReset
        loading={false}
      >
        <SlotFormFields
          form={createForm} setForm={setCreateForm}
          country={createCountry} setCountry={setCreateCountry}
          state={createState}     setState={setCreateState}
          city={createCity}       setCity={setCreateCity}
          prefix="create"
        />
        <Toggle
          name="create_is_active" title="Status"
          checked={createForm.is_active}
          onChange={(v) => setCreateForm((p) => ({ ...p, is_active: v }))}
        />
      </Form>

      {/* â"€â"€ EDIT FORM â"€â"€ */}
      {editRow && (
        <Form
          showMe={openEditForm}
          cols={2} card
          title="Edit Time Slot"
          subtitle={`Editing: ${editRow.name || "-"} Â· ${editRow.area_name || ""}`}
          onSubmit={handleUpdateSubmit}
          onReset={() => { setOpenEditForm(false); setEditRow(null); }}
          submitLabel="Save Changes"
          showReset
          loading={editLoading}
        >
          <SlotFormFields
            form={editForm} setForm={setEditForm}
            country={editCountry} setCountry={setEditCountry}
            state={editState}     setState={setEditState}
            city={editCity}       setCity={setEditCity}
            prefix="edit"
          />
          <Toggle
            name="edit_is_active" title="Status"
            checked={editForm.is_active}
            onChange={(v) => setEditForm((p) => ({ ...p, is_active: v }))}
          />
        </Form>
      )}

      {/* â"€â"€ TABLE â"€â"€ */}
      <PaginatedTable
        showMe={!openCreateForm && !openEditForm}
        title="Time Slots" badge="Masters" subtitle={`${total} records found`}
        data={data} total={total} loading={loading} page={page} limit={limit}
        onPageChange={(p: number) => { setPage(p);  fetchData({ page: p }); }}
        onLimitChange={(l: number) => { setLimit(l); fetchData({ limit: l, page: 1 }); }}
        onSort={() => {}}
        onSearch={(v: string) => { setSearch(v); fetchData({ search: v, page: 1 }); }}
        searchValue={search}
        showSearch showFilter showExport showRefresh showAdd={false}
        onRefresh={() => fetchData()}
        rowKey="slot_id"
        headerActions={
          <div className="flex items-center gap-2">
            {/* Bulk Excel upload - appears just before Add New */}
            <button
              type="button"
              onClick={() => { setBulkFile(null); setBulkResult(null); setOpenBulkModal(true); }}
              className="cursor-pointer inline-flex items-center gap-2 px-3 py-1 text-xs rounded-lg transition-all border active:bg-[#e2e8f0] text-[#475569] hover:text-[#0f172a] hover:bg-[#f1f5f9] border-[#e2e8f0] hover:border-[#e2e8f0]"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Upload via Excel
            </button>
            <button
              type="button"
              onClick={() => { resetCreateForm(); setOpenCreateForm(true); }}
              className="cursor-pointer inline-flex items-center gap-2 px-3 py-1 text-xs rounded-lg transition-all border active:bg-[#e2e8f0] text-[#475569] hover:text-[#0f172a] hover:bg-[#f1f5f9] border-[#e2e8f0] hover:border-[#e2e8f0]"
            >
              <Plus className="w-3.5 h-3.5" />
              Add New
            </button>
          </div>
        }
      >
        <Filters>
          <DropdownFilter
            value={filterCountryId}
            onChange={(v: string) => {
              setFilterCountryId(v);
              setFilterStateId("");
              setFilterCityId("");
              setFilterAreaId("");
              setPage(1);
              fetchData({ page: 1, area_id: "" });
            }}
            placeholder="All Countries"
            options={geoOptions.countries}
          />
          <DropdownFilter
            value={filterStateId}
            onChange={(v: string) => {
              setFilterStateId(v);
              setFilterCityId("");
              setFilterAreaId("");
              setPage(1);
              fetchData({ page: 1, area_id: "" });
            }}
            placeholder="All States"
            options={geoOptions.states}
          />
          <DropdownFilter
            value={filterCityId}
            onChange={(v: string) => {
              setFilterCityId(v);
              setFilterAreaId("");
              setPage(1);
              fetchData({ page: 1, area_id: "" });
            }}
            placeholder="All Cities"
            options={geoOptions.cities}
          />
          <DropdownFilter
            value={filterAreaId}
            onChange={(v: string) => {
              setFilterAreaId(v);
              setPage(1);
              fetchData({ page: 1, area_id: v });
            }}
            placeholder="All Areas"
            options={geoOptions.areas}
          />
          <DropdownFilter
            value={filterServiceId}
            onChange={(v: string) => {
              setFilterServiceId(v);
              setPage(1);
              fetchData({ page: 1, service_id: v });
            }}
            placeholder="All Services"
            options={serviceFilterOptions}
          />
          <ToggleFilter
            value={filterInstantOnly}
            onChange={(v: boolean) => {
              setFilterInstantOnly(v);
              setPage(1);
              fetchData({ page: 1, is_instant: v ? true : undefined });
            }}
            label="Instant only"
          />
          <ToggleFilter
            value={filterActiveOnly}
            onChange={(v: boolean) => {
              setFilterActiveOnly(v);
              setPage(1);
              fetchData({ page: 1, is_active: v ? true : undefined });
            }}
            label="Active only"
          />
        </Filters>
        <Column header="SL"         type="serial" />
        <Column header="Slot Name"  dataKey="name"       sortable />
        <Column header="Area"       dataKey="area_name" />
        <Column header="Service"    dataKey="service" />
        <Column header="Start Time" dataKey="start_time" type="time" />
        <Column header="End Time"   dataKey="end_time"   type="time" />
        <Column header="Surge"      dataKey="surge_multiplier" render={(v: any) => (v != null && Number(v) !== 1 ? `${v}Ã—` : "-")} />
        <Column header="Capacity"   dataKey="max_capacity" render={(v: any) => v ?? "-"} />
        <Column header="Instant"    dataKey="is_instant" render={(v: any) => v
          ? <span className="px-2 py-0.5 rounded-full bg-[#eff6ff] text-[#2563eb] text-[10px] font-semibold">Yes</span>
          : <span className="text-[#5c6a7f] text-[11px]">No</span>
        } />
        <Column header="Status"     dataKey="is_active"  type="toggle" onToggle={handleToggle} />
        <Column
          header="Action" dataKey="_actions" type="actions" align="right"
          actions={buildBulkCrudActions({
            onEdit:           handleEdit,
            onActivateRow:    (row) => { void handleToggle(true, row); },
            onDeactivateRow:  (row) => { void handleToggle(false, row); },
            onBulkActivate:   handleBulkActivate,
            onBulkDeactivate: handleBulkDeactivate,
            extra: [
              {
                label:   "Copy Record",
                icon:    Copy,
                onClick: handleCopy,
              },
            ],
          })}
        />
      </PaginatedTable>

      {/* â"€â"€ DEACTIVATE CONFIRMATION MODAL â"€â"€ */}
      <Modal openModal={openDeactivateModal} setOpenModal={setOpenDeactivateModal}>
        <div className="p-2 bg-[#ffffff] rounded-2xl w-full max-w-sm mx-auto text-center">
          <h2 className="text-[16px] font-bold">Deactivate Record?</h2>
          <p className="text-[12px] text-[#5c6a7f] mt-2">The record will be deactivated and moved to the bottom of the list.</p>
          <div className="mt-6 flex gap-2.5">
            <button onClick={() => setOpenDeactivateModal(false)}
              className="flex-1 py-2.5 rounded-xl bg-[#f1f5f9] font-semibold text-[13px]">Cancel</button>
            <button onClick={deactivateRecord}
              className="flex-1 py-2.5 rounded-xl bg-[#fef2f2] text-[#ffffff] font-semibold text-[13px]">Deactivate</button>
          </div>
        </div>
      </Modal>

      {/* â"€â"€ BULK EXCEL UPLOAD MODAL â"€â"€ */}
      <Modal openModal={openBulkModal} setOpenModal={setOpenBulkModal}>
        <div className="p-4 bg-[#ffffff] rounded-2xl w-full max-w-lg mx-auto space-y-4">
          <div>
            <h2 className="text-[16px] font-bold text-[#1e293b]">Bulk Upload via Excel</h2>
            <p className="text-[12px] text-[#5c6a7f] mt-0.5">
              Download the template, fill in the data, then upload the completed file.
            </p>
          </div>

          {/* Template download */}
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#f8fafc] border border-[#e2e8f0]">
            <div>
              <p className="text-[13px] font-semibold text-[#334155]">Download Template</p>
              <p className="text-[11px] text-[#5c6a7f] mt-0.5">
                Columns: slot_name, start_time, end_time, area_id, service_id, surge_multiplier, max_capacity, is_instant, is_active
              </p>
            </div>
            <button
              type="button"
              onClick={exportTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#ffffff] border border-[#e2e8f0] text-[12px] font-semibold text-[#334155] hover:bg-[#f8fafc] transition-colors shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              .xlsx
            </button>
          </div>

          {/* File picker */}
          <div>
            <p className="text-[12px] font-semibold text-[#475569] mb-1.5">Select File</p>
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-[#e2e8f0] hover:border-[#93c5fd] transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-5 h-5 text-[#5c6a7f] shrink-0" />
              <div className="flex-1 min-w-0">
                {bulkFile
                  ? <p className="text-[13px] font-semibold text-[#334155] truncate">{bulkFile.name}</p>
                  : <p className="text-[13px] text-[#5c6a7f]">Click to choose an .xlsx file</p>
                }
              </div>
              {bulkFile && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setBulkFile(null); setBulkResult(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  className="text-[#5c6a7f] hover:text-[#475569]"
                >âœ•</button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => { setBulkFile(e.target.files?.[0] ?? null); setBulkResult(null); }}
            />
          </div>

          {/* Result summary */}
          {bulkResult && (
            <div className={`rounded-xl p-3 text-[12px] space-y-1 ${bulkResult.failed === 0 ? "bg-[#f0fdf4] border border-[#bbf7d0]" : "bg-[#fffbeb] border border-[#fde68a]"}`}>
              <p className="font-semibold text-[#334155]">
                {bulkResult.success} created successfully
                {bulkResult.failed > 0 && `, ${bulkResult.failed} failed`}
              </p>
              {bulkResult.errors.slice(0, 5).map((e, i) => (
                <p key={i} className="text-[#dc2626]">{e}</p>
              ))}
              {bulkResult.errors.length > 5 && (
                <p className="text-[#53697e]">â€¦and {bulkResult.errors.length - 5} more errors</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              disabled={!bulkFile || bulkLoading}
              onClick={handleBulkUpload}
              className="flex-1 py-2.5 rounded-xl bg-[#0f172a] text-[#ffffff] font-semibold text-[13px] disabled:opacity-50 hover:bg-[#334155] transition-colors"
            >
              {bulkLoading ? "Uploadingâ€¦" : "Upload & Import"}
            </button>
            <button
              type="button"
              onClick={() => setOpenBulkModal(false)}
              className="px-5 py-2.5 rounded-xl bg-[#f1f5f9] font-semibold text-[13px]"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

