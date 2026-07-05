"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlignLeft, Calendar, CalendarDays, Check, ChevronLeft, ChevronRight,
  Clock, Copy, Headphones, MapPin, MessageCircle, Phone, Shield, Star,
  Tag, Truck, User, Wrench,
} from "lucide-react";
import { trackBooking } from "@/lib/api/userClient";
import { loadGoogleMaps } from "@/lib/gmapsLoader";
import { resolveServiceImageUrl } from "@/lib/serviceImage";

// ─── Types ────────────────────────────────────────────────────────────────────
type Overview = {
  booking_id: number; booking_uid?: string;
  booking_placed_label?: string; total_amount?: number;
  status_badge?: string; booking_status_id?: number;
};
type CurrentStatus = { title?: string; subtitle?: string };
type TimelineStep = {
  key: string; title: string; timestamp?: string | null;
  done?: boolean; active?: boolean; pending?: boolean; eta_minutes?: number | null;
};
type Technician = {
  name?: string | null; mobile_number?: string | null; photo_url?: string | null;
  rating_avg?: number | null; jobs_completed?: number;
  experience_label?: string | null;
  vehicle_model?: string | null; license_plate?: string | null;
  can_call?: boolean; can_message?: boolean;
};
type MapData = {
  destination?: { latitude?: number | null; longitude?: number | null; label?: string };
  technician?: { latitude?: number | null; longitude?: number | null };
  route_eta_minutes?: number | null; distance_km?: number | null;
};
type Appointment = {
  date_display?: string; day_of_week?: string | null;
  time_slot?: string; address_summary?: string;
  booking_type?: string;
};
type ServiceLine = {
  service_id?: number; service_name?: string; service_icon?: string;
  image?: string;
  subtype_label?: string; quantity?: number; unit_label?: string;
  line_total?: number; is_included?: boolean;
};
type TrackResponse = {
  overview: Overview; current_status: CurrentStatus;
  timeline: TimelineStep[]; technician?: Technician | null;
  map?: MapData; appointment?: Appointment;
  services?: { lines?: ServiceLine[] };
};

// ─── Google Map component ─────────────────────────────────────────────────────
function LiveMap({
  techLat, techLng, destLat, destLng, destLabel, techPhotoUrl, techName,
}: {
  techLat?: number | null; techLng?: number | null;
  destLat?: number | null; destLng?: number | null; destLabel?: string;
  techPhotoUrl?: string | null; techName?: string | null;
}) {
  const mapRef  = useRef<HTMLDivElement>(null);
  const gMap    = useRef<google.maps.Map | null>(null);
  const techMkr = useRef<google.maps.Marker | null>(null);
  const [err, setErr] = useState("");

  // Build circular photo marker icon using canvas
  const buildPhotoIcon = (photoUrl: string): Promise<string> =>
    new Promise((resolve) => {
      const SIZE = 48;
      const canvas = document.createElement("canvas");
      canvas.width = SIZE + 4; canvas.height = SIZE + 4;
      const ctx = canvas.getContext("2d")!;
      const img = new Image(); img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.beginPath();
        ctx.arc(SIZE / 2 + 2, SIZE / 2 + 2, SIZE / 2 + 2, 0, Math.PI * 2);
        ctx.fillStyle = "#0e55d9"; ctx.fill();
        ctx.beginPath();
        ctx.arc(SIZE / 2 + 2, SIZE / 2 + 2, SIZE / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, 2, 2, SIZE, SIZE);
        resolve(canvas.toDataURL());
      };
      img.onerror = () => resolve("");
      img.src = photoUrl;
    });

  // Build initials marker (when no photo)
  const buildInitialsIcon = (name: string): string => {
    const SIZE = 48;
    const canvas = document.createElement("canvas");
    canvas.width = SIZE + 4; canvas.height = SIZE + 4;
    const ctx = canvas.getContext("2d")!;
    ctx.beginPath();
    ctx.arc(SIZE / 2 + 2, SIZE / 2 + 2, SIZE / 2 + 2, 0, Math.PI * 2);
    ctx.fillStyle = "#0e55d9"; ctx.fill();
    ctx.beginPath();
    ctx.arc(SIZE / 2 + 2, SIZE / 2 + 2, SIZE / 2, 0, Math.PI * 2);
    ctx.fillStyle = "#1d4ed8"; ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(name.charAt(0).toUpperCase(), SIZE / 2 + 2, SIZE / 2 + 3);
    return canvas.toDataURL();
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadGoogleMaps();
        if (cancelled || !mapRef.current) return;

        const center = destLat && destLng
          ? { lat: destLat, lng: destLng }
          : techLat && techLng
            ? { lat: techLat, lng: techLng }
            : { lat: 21.2514, lng: 81.6296 };

        gMap.current = new google.maps.Map(mapRef.current, {
          center, zoom: 14,
          disableDefaultUI: true, zoomControl: true,
          styles: [
            { featureType: "poi", stylers: [{ visibility: "off" }] },
            { featureType: "transit", stylers: [{ visibility: "off" }] },
          ],
        });

        // Customer destination — green home pin
        if (destLat && destLng) {
          new google.maps.Marker({
            position: { lat: destLat, lng: destLng },
            map: gMap.current,
            title: destLabel || "Your Location",
            icon: {
              url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48">
                  <circle cx="20" cy="20" r="20" fill="#10b981"/>
                  <text x="20" y="26" font-size="18" text-anchor="middle" fill="white">⌂</text>
                  <polygon points="12,36 20,48 28,36" fill="#10b981"/>
                </svg>`),
              scaledSize: new google.maps.Size(40, 48),
              anchor: new google.maps.Point(20, 48),
            },
          });
        }

        // Technician — circular photo or initials
        if (techLat && techLng) {
          let iconUrl = "";
          if (techPhotoUrl) {
            iconUrl = await buildPhotoIcon(techPhotoUrl);
          }
          if (!iconUrl && techName) {
            iconUrl = buildInitialsIcon(techName);
          }

          const icon = iconUrl ? {
            url: iconUrl,
            scaledSize: new google.maps.Size(52, 52),
            anchor: new google.maps.Point(26, 26),
          } : {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10, fillColor: "#0e55d9", fillOpacity: 1,
            strokeColor: "#fff", strokeWeight: 3,
          };

          techMkr.current = new google.maps.Marker({
            position: { lat: techLat, lng: techLng },
            map: gMap.current, title: techName || "Technician",
            icon,
          });

          // Road-based route using Directions Service
          if (destLat && destLng && gMap.current) {
            const directionsService  = new google.maps.DirectionsService();
            const directionsRenderer = new google.maps.DirectionsRenderer({
              map: gMap.current,
              suppressMarkers: true, // we handle markers ourselves
              polylineOptions: {
                strokeColor: "#2563eb",
                strokeOpacity: 1,
                strokeWeight: 4,
              },
            });

            directionsService.route(
              {
                origin:      { lat: techLat, lng: techLng },
                destination: { lat: destLat, lng: destLng },
                travelMode: google.maps.TravelMode.DRIVING,
              },
              (result, status) => {
                if (status === google.maps.DirectionsStatus.OK && result) {
                  directionsRenderer.setDirections(result);
                } else {
                  // Fallback: straight dashed line if Directions API fails
                  new google.maps.Polyline({
                    path: [{ lat: techLat, lng: techLng }, { lat: destLat, lng: destLng }],
                    map: gMap.current!,
                    strokeColor: "#2563eb",
                    strokeOpacity: 0.6,
                    strokeWeight: 3,
                    icons: [{ icon: { path: "M 0,-1 0,1", strokeOpacity: 1, scale: 3 }, offset: "0", repeat: "12px" }],
                  });
                }
              }
            );
          }
        }

        // fitBounds handled by DirectionsRenderer when road route loads;
        // for fallback (no tech/no route), fit manually
        if (!techLat && destLat && destLng) {
          gMap.current.setCenter({ lat: destLat, lng: destLng });
          gMap.current.setZoom(15);
        }
      } catch {
        if (!cancelled) setErr("Map unavailable");
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!gMap.current || !techLat || !techLng) return;
    if (techMkr.current) techMkr.current.setPosition({ lat: techLat, lng: techLng });
  }, [techLat, techLng]);

  if (err) return <div className="flex h-full items-center justify-center text-[12px] text-[#94a3b8]">{err}</div>;
  return <div ref={mapRef} className="h-full w-full" />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const TRACK_STEPS: { key: string; label: string; Icon: React.ComponentType<{size?:number;strokeWidth?:number;className?:string}> }[] = [
  { key: "confirmed",  label: "Booking Confirmed",   Icon: CalendarDays },
  { key: "assigned",   label: "Technician Assigned", Icon: User         },
  { key: "on_the_way", label: "On The Way",          Icon: Truck        },
  { key: "started",    label: "Job Started",         Icon: Calendar     },
  { key: "completed",  label: "Job Completed",       Icon: Wrench       },
];

function fmtTs(ts?: string | null) {
  if (!ts) return null;
  const d = new Date(ts);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) +
    ", " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

export default function TrackBookingPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const router        = useRouter();
  const [data,    setData]    = useState<TrackResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied,  setCopied]  = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTrack = async () => {
    const res = await trackBooking(bookingId) as { status: boolean; data?: TrackResponse };
    if (res.data) setData(res.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTrack();
    pollRef.current = setInterval(fetchTrack, 30000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const copyUid = async (uid: string) => {
    await navigator.clipboard.writeText(uid).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#f8fafc] pb-24">
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-5 animate-pulse">
        {/* Nav */}
        <div className="flex items-center justify-between">
          <div className="h-4 w-14 rounded bg-[#e2e8f0]" />
          <div className="h-4 w-28 rounded bg-[#e2e8f0]" />
          <div className="h-4 w-14 rounded bg-[#e2e8f0]" />
        </div>
        {/* Summary bar */}
        <div className="flex gap-6 rounded-2xl border border-[#f1f5f9] bg-[#ffffff] px-5 py-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-1.5 flex-1">
              <div className="h-2.5 w-20 rounded bg-[#f1f5f9]" />
              <div className="h-4 w-32 rounded bg-[#e2e8f0]" />
            </div>
          ))}
          <div className="h-7 w-24 self-center rounded-full bg-[#f1f5f9]" />
        </div>
        {/* Status card + stepper */}
        <div className="rounded-2xl border border-[#f1f5f9] bg-[#ffffff] p-5">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-full bg-[#f1f5f9]" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-48 rounded bg-[#e2e8f0]" />
              <div className="h-3 w-64 rounded bg-[#f1f5f9]" />
            </div>
          </div>
          <div className="flex justify-between">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className="h-10 w-10 rounded-full bg-[#f1f5f9]" />
                <div className="h-2.5 w-14 rounded bg-[#f1f5f9]" />
                <div className="h-2 w-10 rounded bg-[#f1f5f9]" />
              </div>
            ))}
          </div>
        </div>
        {/* Technician + Map */}
        <div className="grid gap-0 lg:grid-cols-2 rounded-2xl border border-[#f1f5f9] bg-[#ffffff] overflow-hidden">
          <div className="p-6 space-y-5 border-r border-[#f8fafc]">
            <div className="flex items-start gap-4">
              <div className="h-20 w-20 rounded-full bg-[#e2e8f0] shrink-0" />
              <div className="space-y-2 flex-1 pt-2">
                <div className="h-5 w-36 rounded bg-[#e2e8f0]" />
                <div className="h-3 w-24 rounded bg-[#f1f5f9]" />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="h-11 flex-1 rounded-2xl bg-[#f1f5f9]" />
              <div className="h-11 flex-1 rounded-2xl bg-[#f1f5f9]" />
            </div>
            <div className="h-px bg-[#f1f5f9]" />
            <div className="flex gap-3 items-center">
              <div className="h-9 w-9 rounded-xl bg-[#f1f5f9]" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 w-32 rounded bg-[#f1f5f9]" />
                <div className="h-5 w-24 rounded-lg bg-[#f1f5f9]" />
              </div>
            </div>
          </div>
          <div className="bg-[#f1f5f9]" style={{ minHeight: 280 }} />
        </div>
        {/* Appointment details */}
        <div className="rounded-2xl border border-[#f1f5f9] bg-[#ffffff] overflow-hidden">
          <div className="border-b border-[#f8fafc] px-5 py-3">
            <div className="h-4 w-40 rounded bg-[#e2e8f0]" />
          </div>
          <div className="grid grid-cols-2 gap-0">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`flex gap-3 p-5 ${i < 2 ? "border-b" : ""} ${i % 2 === 0 ? "border-r" : ""} border-[#f8fafc]`}>
                <div className="h-8 w-8 shrink-0 rounded-lg bg-[#f1f5f9]" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-2.5 w-16 rounded bg-[#f1f5f9]" />
                  <div className="h-3.5 w-32 rounded bg-[#e2e8f0]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
  if (!data) return (
    <div className="flex flex-col items-center py-24 text-center">
      <MapPin size={48} className="text-[#e2e8f0] mb-3" />
      <p className="text-[15px] font-semibold text-[#64748b]">Tracking info unavailable</p>
      <button type="button" onClick={() => router.back()} className="mt-4 text-[13px] font-semibold text-[#0e55d9]">← Back</button>
    </div>
  );

  const { overview, current_status, timeline, technician: tech, map: mapData, appointment, services } = data;
  const uid      = overview.booking_uid ?? String(overview.booking_id);
  const lines    = services?.lines ?? [];
  const activeStep = timeline?.findIndex(s => s.active) ?? -1;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-32">
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-5">

        {/* ── Top nav ── */}
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => router.back()}
            className="flex items-center gap-1.5 text-[13px] font-semibold text-[#64748b] hover:text-[#0e55d9] transition-colors">
            <ChevronLeft size={18} /> Back
          </button>
          <h1 className="text-[16px] font-black text-[#0f172a]">Track Booking</h1>
          <Link href="/contact" className="flex flex-col items-center text-[#64748b] hover:text-[#0e55d9]">
            <Headphones size={18} />
            <span className="text-[10px] font-semibold mt-0.5">Support</span>
          </Link>
        </div>

        {/* ── Booking summary bar ── */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-[#e2e8f0] bg-[#ffffff] px-5 py-4 shadow-sm">
          <div>
            <p className="text-[10.5px] font-semibold text-[#94a3b8]">Booking ID</p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="font-mono text-[15px] font-black text-[#0f172a]">{uid}</p>
              <button type="button" onClick={() => copyUid(uid)}
                className="rounded-md border border-[#e2e8f0] p-1 text-[#94a3b8] hover:text-[#0e55d9] hover:border-[#0e55d9]/30 transition-colors">
                {copied ? <Check size={12} className="text-[#ecfdf5]" /> : <Copy size={12} />}
              </button>
            </div>
          </div>
          <div className="h-8 w-px bg-[#f1f5f9] hidden sm:block" />
          <div>
            <p className="text-[10.5px] font-semibold text-[#94a3b8]">Booking Date</p>
            <p className="text-[13px] font-bold text-[#0f172a] mt-0.5">{overview.booking_placed_label ?? "—"}</p>
          </div>
          <div className="h-8 w-px bg-[#f1f5f9] hidden sm:block" />
          <div>
            <p className="text-[10.5px] font-semibold text-[#94a3b8]">Total Amount</p>
            <p className="text-[15px] font-black text-[#0f172a] mt-0.5">₹{(overview.total_amount ?? 0).toLocaleString("en-IN")}</p>
          </div>
          <div className="ml-auto">
            <span className="rounded-full border border-[#a7f3d0] bg-[#ecfdf5] px-3 py-1.5 text-[11px] font-bold text-[#047857]">
              {overview.status_badge ?? "Confirmed"}
            </span>
          </div>
        </div>

        {/* ── Current Status + horizontal stepper ── */}
        <div className="rounded-2xl border border-[#e2e8f0] bg-[#ffffff] p-5 shadow-sm">
          <p className="mb-3 text-[12px] font-black uppercase tracking-widest text-[#94a3b8]">Current Status</p>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#ecfdf5]">
              <Truck size={24} className="text-[#059669]" />
            </div>
            <div>
              <p className="text-[18px] font-black text-[#059669]">{current_status?.title ?? "Processing"}</p>
              <p className="text-[12.5px] text-[#64748b] mt-0.5">{current_status?.subtitle}</p>
            </div>
          </div>

          {/* Horizontal stepper */}
          <div className="relative flex items-start justify-between">
            <div className="absolute top-5 left-[9%] right-[9%] h-px border-t-2 border-dashed border-[#e2e8f0]" />
            {TRACK_STEPS.map((step, i) => {
              const tStep = (timeline ?? []).find(s => s.key === step.key);
              const done    = tStep?.done ?? false;
              const active  = tStep?.active ?? false;
              const eta     = tStep?.eta_minutes;
              return (
                <div key={step.key} className="relative z-10 flex flex-1 flex-col items-center gap-1.5 text-center">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                    done    ? "border-[#ecfdf5] bg-[#ecfdf5] text-[#ffffff]"
                    : active ? "border-[#0e55d9] bg-[#ffffff] text-[#0e55d9]"
                    : "border-[#e2e8f0] bg-[#ffffff] text-[#cbd5e1]"
                  }`}>
                    {done
                      ? <Check size={16} strokeWidth={3} />
                      : <step.Icon size={15} strokeWidth={done || active ? 2 : 1.8} />}
                  </div>
                  <p className={`text-[10.5px] font-bold leading-tight max-w-[68px] ${
                    done || active ? "text-[#0f172a]" : "text-[#94a3b8]"
                  }`}>{step.label}</p>
                  {eta != null && active ? (
                    <p className="text-[10px] font-bold text-[#059669]">ETA: {eta} mins</p>
                  ) : tStep?.timestamp ? (
                    <p className="text-[9.5px] text-[#94a3b8]">{fmtTs(tStep.timestamp)}</p>
                  ) : (
                    <p className={`text-[9.5px] ${done ? "text-[#ecfdf5] font-semibold" : "text-[#cbd5e1]"}`}>
                      {done ? "Done" : "Pending"}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Technician + Map (side by side) ── */}
        {(tech?.name || mapData) && (
          <div className="grid gap-0 lg:grid-cols-2 rounded-2xl border border-[#e2e8f0] bg-[#ffffff] shadow-sm overflow-hidden">

            {/* ── Left: Technician card ── */}
            {tech?.name && (
              <div className="flex flex-col gap-5 p-6 border-b lg:border-b-0 lg:border-r border-[#f1f5f9]">

                {/* Photo + info */}
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    {tech.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={tech.photo_url} alt={tech.name}
                        className="h-20 w-20 rounded-full object-cover border-4 border-[#ffffff] shadow-md ring-2 ring-[#e2e8f0]" />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#0e55d9] border-4 border-[#ffffff] shadow-md ring-2 ring-[#e2e8f0] text-[26px] font-black text-[#ffffff]">
                        {tech.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-[18px] font-black text-[#0f172a]">{tech.name}</p>
                    {tech.rating_avg != null ? (
                      <div className="flex items-center gap-1.5 mt-1">
                        <Star size={14} className="text-[#f59e0b]" fill="currentColor" />
                        <span className="text-[13px] font-black text-[#0f172a]">{tech.rating_avg.toFixed(1)}</span>
                        {tech.jobs_completed ? (
                          <span className="text-[12px] text-[#64748b]">({tech.jobs_completed}+ jobs)</span>
                        ) : null}
                      </div>
                    ) : tech.jobs_completed ? (
                      <p className="mt-1 text-[12px] text-[#64748b]">{tech.jobs_completed}+ jobs completed</p>
                    ) : null}
                    {tech.experience_label && (
                      <p className="mt-0.5 text-[12px] text-[#64748b]">{tech.experience_label}</p>
                    )}
                  </div>
                </div>

                {/* Call / Message buttons */}
                <div className="flex gap-3">
                  <a href={tech.mobile_number ? `tel:${tech.mobile_number}` : undefined}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 py-3 text-[13px] font-bold transition-all ${
                      tech.can_call
                        ? "border-[#0e55d9] text-[#0e55d9] hover:bg-[#eef4ff]"
                        : "border-[#e2e8f0] text-[#cbd5e1] pointer-events-none"
                    }`}>
                    <Phone size={16} strokeWidth={2} /> Call
                  </a>
                  <button type="button"
                    className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 py-3 text-[13px] font-bold transition-all ${
                      tech.can_message
                        ? "border-[#0e55d9] text-[#0e55d9] hover:bg-[#eef4ff]"
                        : "border-[#e2e8f0] text-[#cbd5e1]"
                    }`}>
                    <MessageCircle size={16} strokeWidth={2} /> Message
                  </button>
                </div>

                {/* Divider */}
                <div className="h-px bg-[#f1f5f9]" />

                {/* Vehicle */}
                <div className="flex items-center gap-3">
                  {/* Scooter SVG */}
                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className="shrink-0 text-[#64748b]">
                    <circle cx="8" cy="27" r="5" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <circle cx="28" cy="27" r="5" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <path d="M13 27h10M23 27l-4-10h-5l-3 5h-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M23 17h5l1 4h-6v-4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                  </svg>
                  <div>
                    <p className="text-[13px] font-semibold text-[#374151]">
                      <span className="text-[#94a3b8]">Vehicle: </span>
                      {tech.vehicle_model ?? "Two Wheeler"}
                    </p>
                    {tech.license_plate && (
                      <span className="mt-1.5 inline-block rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-1 font-mono text-[12px] font-bold text-[#374151] tracking-wider">
                        {tech.license_plate}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Right: Map ── */}
            <div className="relative flex flex-col" style={{ minHeight: 320 }}>
              {/* ETA badge — top right of map */}
              {mapData?.route_eta_minutes != null && (
                <div className="absolute right-3 top-3 z-10">
                  <span className="rounded-xl border border-[#e2e8f0] bg-[#ffffff] px-3 py-1.5 text-[12px] font-black text-[#0f172a] shadow-sm">
                    ETA: {mapData.route_eta_minutes} mins
                  </span>
                </div>
              )}

              {/* Map */}
              <div className="flex-1">
                <LiveMap
                  techLat={mapData?.technician?.latitude}
                  techLng={mapData?.technician?.longitude}
                  destLat={mapData?.destination?.latitude}
                  destLng={mapData?.destination?.longitude}
                  destLabel={mapData?.destination?.label}
                  techPhotoUrl={tech?.photo_url}
                  techName={tech?.name}
                />
              </div>

              {/* Your Location footer */}
              {mapData?.destination?.label && (
                <div className="flex items-center gap-2.5 border-t border-[#f1f5f9] bg-[#ffffff] px-4 py-3">
                  <MapPin size={18} className="shrink-0 text-[#ecfdf5]" />
                  <div>
                    <p className="text-[11px] font-black text-[#059669] uppercase tracking-wide">Your Location</p>
                    <p className="text-[12.5px] font-semibold text-[#374151]">{mapData.destination.label}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Appointment Details ── */}
        {appointment && (
          <div className="rounded-2xl border border-[#e2e8f0] bg-[#ffffff] shadow-sm overflow-hidden">
            <div className="border-b border-[#f1f5f9] px-5 py-3">
              <h2 className="text-[14px] font-black text-[#0f172a]">Appointment Details</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-0 p-0">
              {[
                { Icon: Calendar, label: "Date",         value: appointment.date_display ? `${appointment.date_display}${appointment.day_of_week ? ", " + appointment.day_of_week : ""}` : "—" },
                { Icon: MapPin,   label: "Address",      value: appointment.address_summary ?? "—" },
                { Icon: Clock,    label: "Time Slot",    value: appointment.time_slot ?? "—" },
                { Icon: Tag,      label: "Booking Type", value: appointment.booking_type ?? "General Service" },
              ].map(({ Icon, label, value }, i) => (
                <div key={label} className={`flex items-start gap-3 px-5 py-4 ${i < 2 ? "sm:border-b" : ""} ${i % 2 === 0 ? "sm:border-r" : ""} border-[#f1f5f9]`}>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eef4ff]">
                    <Icon size={15} className="text-[#0e55d9]" />
                  </div>
                  <div>
                    <p className="text-[10.5px] font-semibold text-[#94a3b8]">{label}</p>
                    <p className="text-[13px] font-bold text-[#0f172a] mt-0.5">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Services Booked ── */}
        {lines.length > 0 && (
          <div className="rounded-2xl border border-[#e2e8f0] bg-[#ffffff] shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#f1f5f9] px-5 py-3">
              <h2 className="text-[14px] font-black text-[#0f172a]">Services Booked ({lines.length})</h2>
              <Link href={`/bookings/${bookingId}`} className="flex items-center gap-0.5 text-[12px] font-bold text-[#0e55d9] hover:underline">
                View Details <ChevronRight size={13} />
              </Link>
            </div>
            <div className="divide-y divide-[#f1f5f9]">
              {lines.map((line, i) => {
                const serviceIcon = resolveServiceImageUrl(line.service_icon ?? line.image);
                return (
                <div key={i} className="flex items-center gap-3 px-5 py-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#e2e8f0] bg-[#f8fafc]">
                    {serviceIcon ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={serviceIcon} alt="" className="h-9 w-9 object-contain" />
                    ) : (
                      <Wrench size={20} className="text-[#94a3b8]" strokeWidth={1.5} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-[#0f172a]">{line.service_name}</p>
                    <p className="text-[11px] text-[#64748b]">{line.subtype_label}</p>
                    <p className="text-[11px] text-[#94a3b8]">Qty: {line.quantity} {line.unit_label}</p>
                  </div>
                  <p className={`text-[14px] font-black shrink-0 ${line.is_included ? "text-[#94a3b8]" : "text-[#0f172a]"}`}>
                    {line.is_included ? <span className="text-[11px] font-semibold">₹0<br /><span className="text-[#94a3b8]">(Included)</span></span>
                      : `₹${(line.line_total ?? 0).toLocaleString("en-IN")}`}
                  </p>
                </div>
                );
              })}
            </div>

            {/* Instructions hint */}
            <div className="flex items-center gap-2 border-t border-[#f1f5f9] px-5 py-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#0e55d9]/20 bg-[#eef4ff]">
                <AlignLeft size={13} className="text-[#0e55d9]" />
              </div>
              <p className="flex-1 text-[11.5px] text-[#64748b]">You can add instructions for the technician on the booking details page.</p>
              <Link href={`/bookings/${bookingId}`}><ChevronRight size={15} className="text-[#cbd5e1]" /></Link>
            </div>
          </div>
        )}

        {/* ── Support banner ── */}
        <div className="flex items-center justify-between rounded-2xl border border-[#e2e8f0] bg-[#ffffff] px-5 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef4ff]">
              <Shield size={20} className="text-[#0e55d9]" />
            </div>
            <div>
              <p className="text-[13px] font-black text-[#0f172a]">Need help with your booking?</p>
              <p className="text-[11px] text-[#64748b]">Our support team is available 24/7 for you.</p>
            </div>
          </div>
          <Link href="/contact"
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-[#0e55d9]/20 bg-[#eef4ff] px-4 py-2.5 text-[12px] font-bold text-[#0e55d9] hover:bg-[#dbeafe] transition-colors">
            <Headphones size={14} /> Contact Support
          </Link>
        </div>

        {/* Safety note */}
        <p className="flex items-center justify-center gap-1.5 text-[11px] text-[#94a3b8]">
          <Shield size={12} /> For your safety, all our technicians are background verified.
        </p>
      </div>

      {/* ── Sticky bottom CTAs ── */}
      <div className="fixed bottom-16 left-0 right-0 z-40 border-t border-[#e2e8f0] bg-[#ffffff]/95 px-4 py-3 backdrop-blur-md lg:bottom-0">
        <div className="mx-auto flex max-w-4xl gap-3">
          <Link href={`/bookings/${bookingId}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#0e55d9] bg-[#ffffff] py-3.5 text-[13px] font-bold text-[#0e55d9] hover:bg-[#eef4ff] transition-all">
            <AlignLeft size={15} /> View Booking Details
          </Link>
          <button type="button" onClick={fetchTrack}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0e55d9] py-3.5 text-[13px] font-black text-[#ffffff] shadow-[0_4px_16px_rgba(14,85,217,0.28)] hover:bg-[#0a46b8] transition-all">
            <MapPin size={15} /> Track Live Location
          </button>
        </div>
      </div>
    </div>
  );
}
