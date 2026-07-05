/** @format */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BadgeCheck,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FileText,
  Gift,
  Headphones,
  Loader2,
  LogOut,
  MapPin,
  Pencil,
  RotateCcw,
  Shield,
  ShoppingCart,
  Star,
  Tag,
  X,
} from "lucide-react";
import {
  getUserProfile,
  getAddresses,
  getBookings,
  logoutUser,
  updateProfileWithPhoto,
} from "@/lib/api/userClient";
import { resolveUploadUrl } from "@/lib/api/coreClient";
import { useUserAuthStore } from "@/store/userAuth.store";
import { useLocationStore } from "@/store/location.store";
import { normalizeCustomer } from "@/lib/userAuth";
import {
  getAddressDisplayTitle,
  getAddressLabel,
  normalizeUserAddresses,
  type UserAddress,
} from "@/lib/userAddress";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function LabelBadge({ label }: { label: string }) {
  const s =
    label === "Home"
      ? "bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]"
      : label === "Office"
        ? "bg-[#f5f3ff] text-[#6d28d9] border-[#ddd6fe]"
        : "bg-[#f8fafc] text-[#475569] border-[#e2e8f0]";
  return (
    <span
      className={`shrink-0 rounded-full border px-2 py-0.5 text-[9.5px] font-bold ${s}`}>
      {label}
    </span>
  );
}

function SidebarNav({
  icon: Icon,
  label,
  sub,
  href,
  danger,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  sub?: string;
  href?: string;
  danger?: boolean;
  onClick?: () => void;
}) {
  const base = `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
    danger ? "hover:bg-[#fef2f2]" : "hover:bg-[#f8fafc]"
  }`;
  const content = (
    <>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${danger ? "bg-[#fef2f2]" : "bg-[#f0f4ff]"}`}>
        <Icon
          size={15}
          className={danger ? "text-[#7b5757]" : "text-[#0e55d9]"}
          strokeWidth={1.8}
        />
      </div>
      <div className='min-w-0 flex-1'>
        <p
          className={`text-[13px] font-semibold ${danger ? "text-[#7b5757]" : "text-[#0f172a]"}`}>
          {label}
        </p>
        {sub && <p className='text-[11px] text-[#94a3b8]'>{sub}</p>}
      </div>
      {!danger && (
        <ChevronRight size={13} className='shrink-0 text-[#cbd5e1]' />
      )}
    </>
  );
  if (href)
    return (
      <Link href={href} className={base}>
        {content}
      </Link>
    );
  return (
    <button type='button' onClick={onClick} className={base}>
      {content}
    </button>
  );
}

// ─── Edit profile modal ───────────────────────────────────────────────────────
function EditProfileModal({
  open,
  onClose,
  initial,
  avatarUrl,
  initialLetter,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  initial: { firstName: string; lastName: string; email: string };
  avatarUrl: string;
  initialLetter: string;
  onSaved: () => void;
}) {
  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [email, setEmail] = useState(initial.email);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setFirstName(initial.firstName);
      setLastName(initial.lastName);
      setEmail(initial.email);
      setPhotoFile(null);
      setPhotoPreview(null);
      setError("");
    }
  }, [open, initial]);
  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  if (!open) return null;
  const previewSrc = photoPreview || avatarUrl;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be 10 MB or smaller");
      return;
    }
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setError("");
  };

  const handleSave = async () => {
    if (!firstName.trim()) {
      setError("First name is required");
      return;
    }
    setSaving(true);
    setError("");
    const res = (await updateProfileWithPhoto({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim() || undefined,
      photo: photoFile,
    })) as { status?: boolean; message?: string };
    setSaving(false);
    if (res.status === false) {
      setError(res.message ?? "Could not update profile");
      return;
    }
    onSaved();
    onClose();
  };

  return (
    <div className='fixed inset-0 z-[100] flex items-center justify-center bg-[#000000]/40 p-4'>
      <button type='button' className='absolute inset-0' onClick={onClose} />
      <div className='relative w-full max-w-md rounded-2xl bg-[#ffffff] p-6 shadow-2xl'>
        <div className='mb-5 flex items-center justify-between'>
          <h2 className='text-[18px] font-black text-[#0f172a]'>
            Edit Profile
          </h2>
          <button
            type='button'
            onClick={onClose}
            className='grid h-8 w-8 place-items-center rounded-full bg-[#f1f5f9] text-[#64748b]'>
            <X size={16} />
          </button>
        </div>
        <div className='mb-5 flex flex-col items-center'>
          <div className='relative'>
            {previewSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewSrc}
                alt=''
                className='h-20 w-20 rounded-full border-4 border-[#eef4ff] object-cover'
              />
            ) : (
              <div className='flex h-20 w-20 items-center justify-center rounded-full bg-[#0e55d9] text-[26px] font-black text-[#ffffff]'>
                {initialLetter}
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type='file'
            accept='image/*'
            className='hidden'
            onChange={handlePhotoChange}
          />
          <button
            type='button'
            onClick={() => fileRef.current?.click()}
            className='mt-3 flex items-center gap-1.5 text-[12.5px] font-semibold text-[#0e55d9] hover:underline'>
            <Camera size={14} />{" "}
            {photoFile ? "Choose different photo" : "Change profile photo"}
          </button>
          <p className='mt-1 text-[10.5px] text-[#94a3b8]'>
            Any image format, max 10 MB
          </p>
        </div>
        <div className='space-y-3'>
          {[
            ["First name", firstName, setFirstName],
            ["Last name", lastName, setLastName],
          ].map(([label, val, setter]) => (
            <label key={label as string} className='block'>
              <span className='mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]'>
                {label as string}
              </span>
              <input
                value={val as string}
                onChange={(e) =>
                  (setter as (v: string) => void)(e.target.value)
                }
                className='h-11 w-full rounded-xl border border-[#e2e8f0] px-3 text-[14px] outline-none focus:border-[#0e55d9] focus:ring-2 focus:ring-[#0e55d9]/10'
              />
            </label>
          ))}
          <label className='block'>
            <span className='mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]'>
              Email
            </span>
            <input
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='you@example.com'
              className='h-11 w-full rounded-xl border border-[#e2e8f0] px-3 text-[14px] outline-none focus:border-[#0e55d9] focus:ring-2 focus:ring-[#0e55d9]/10'
            />
          </label>
        </div>
        {error && (
          <p className='mt-3 rounded-lg bg-[#fef2f2] px-3 py-2 text-[12px] text-[#dc2626]'>
            {error}
          </p>
        )}
        <div className='mt-5 flex gap-2'>
          <button
            type='button'
            onClick={onClose}
            className='h-11 flex-1 rounded-xl border border-[#e2e8f0] text-[13px] font-semibold text-[#64748b]'>
            Cancel
          </button>
          <button
            type='button'
            disabled={saving}
            onClick={handleSave}
            className='h-11 flex-1 rounded-xl bg-[#0e55d9] text-[13px] font-black text-[#ffffff] disabled:opacity-60'>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
const ACCOUNT_LINKS = [
  {
    icon: CalendarDays,
    label: "My Bookings",
    sub: "Past & upcoming services",
    href: "/bookings",
  },
  { icon: ShoppingCart, label: "Cart", sub: "View your cart", href: "/cart" },
  {
    icon: CreditCard,
    label: "Payment Methods",
    sub: "Saved cards & UPI",
    href: "/profile/payments",
  },
  {
    icon: Tag,
    label: "My Coupons",
    sub: "Discount codes & offers",
    href: "/profile/coupons",
  },
  {
    icon: Gift,
    label: "Refer & Earn",
    sub: "Invite friends, earn rewards",
    href: "/profile/referral",
  },
] as const;

const SUPPORT_LINKS = [
  {
    icon: Headphones,
    label: "Customer Support",
    sub: "Chat or call 24/7",
    href: "/contact",
  },
  { icon: FileText, label: "Terms of Service", href: "/terms-and-conditions" },
  { icon: Shield, label: "Privacy Policy", href: "/privacy-policy" },
  { icon: RotateCcw, label: "Refund Policy", href: "/refund-policy" },
] as const;

export default function ProfilePage() {
  const router = useRouter();
  const { customer, setCustomer, logout } = useUserAuthStore();
  const { openModal } = useLocationStore();

  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [bookingCount, setBookingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [profileRes, addrRes, bookingsRes] = await Promise.allSettled([
      getUserProfile(),
      getAddresses(),
      getBookings(),
    ]);
    if (profileRes.status === "fulfilled") {
      const c = normalizeCustomer(
        (profileRes.value as { data?: unknown }).data,
      );
      if (c) setCustomer(c);
    }
    if (addrRes.status === "fulfilled") {
      setAddresses(
        normalizeUserAddresses((addrRes.value as { data?: unknown }).data),
      );
    }
    if (bookingsRes.status === "fulfilled") {
      const res = bookingsRes.value as {
        data?: unknown[] | { rows?: unknown[] };
        rows?: unknown[];
      };
      const rows = Array.isArray(res.data)
        ? res.data
        : ((res.data as { rows?: unknown[] })?.rows ?? res.rows ?? []);
      setBookingCount(Array.isArray(rows) ? rows.length : 0);
    }
    setLoading(false);
  }, [setCustomer]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLogout = async () => {
    try { await logoutUser(); } catch { /* best-effort; always clear local session */ }
    logout();
    router.replace("/");
  };

  const name = customer
    ? `${customer.first_name} ${customer.last_name ?? ""}`.trim()
    : "Guest User";
  const avatarUrl = customer?.profile_pitcher
    ? resolveUploadUrl(customer.profile_pitcher)
    : "";
  const initial = name.charAt(0).toUpperCase() || "U";

  const handleAvatarPhotoChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !customer) return;
    if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) return;
    setPhotoUploading(true);
    const res = (await updateProfileWithPhoto({
      firstName: customer.first_name,
      lastName: customer.last_name ?? "",
      email: customer.email ?? undefined,
      photo: file,
    })) as { status?: boolean };
    setPhotoUploading(false);
    if (res.status !== false) await loadData();
  };

  return (
    <>
      <input
        ref={avatarFileRef}
        type='file'
        accept='image/*'
        className='hidden'
        onChange={handleAvatarPhotoChange}
      />

      <div className='min-h-screen bg-[#f8fafc] pb-20'>
        <div className='mx-auto max-w-[1200px] px-6 py-8'>
          {/* ── Page title ── */}
          <div className='mb-8 flex items-center justify-between'>
            <div>
              <h1 className='text-[26px] font-black text-[#0f172a]'>
                My Profile
              </h1>
              <p className='mt-1 text-[14px] text-[#64748b]'>
                Manage your account, addresses, and preferences
              </p>
            </div>
            <button
              type='button'
              onClick={() => setEditOpen(true)}
              className='flex items-center gap-2 rounded-xl border border-[#e2e8f0] bg-[#ffffff] px-5 py-2.5 text-[13px] font-semibold text-[#0e55d9] shadow-sm transition-all hover:bg-[#eef4ff] hover:shadow-md'>
              <Pencil size={14} /> Edit Profile
            </button>
          </div>

          {/* ── Desktop 2-col layout ── */}
          <div className='grid grid-cols-[300px_1fr] gap-6 items-start max-lg:grid-cols-1'>
            {/* ── LEFT: Sidebar ── */}
            <aside className='sticky top-[80px] space-y-4 max-lg:static'>
              {/* Profile card */}
              <div className='rounded-2xl border border-[#e2e8f0] bg-[#ffffff] p-6 shadow-sm'>
                {/* Avatar + info */}
                <div className='flex flex-col items-center text-center'>
                  <div className='relative mb-4'>
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarUrl}
                        alt=''
                        className='h-24 w-24 rounded-full border-4 border-[#ffffff] object-cover shadow-lg ring-2 ring-[#e2e8f0]'
                      />
                    ) : (
                      <div className='flex h-24 w-24 items-center justify-center rounded-full bg-[#0e55d9] text-[30px] font-black text-[#ffffff] shadow-lg ring-2 ring-[#e2e8f0]'>
                        {initial}
                      </div>
                    )}
                    {photoUploading && (
                      <div className='absolute inset-0 flex items-center justify-center rounded-full bg-[#000000]/40'>
                        <Loader2
                          size={22}
                          className='animate-spin text-[#ffffff]'
                        />
                      </div>
                    )}
                    <button
                      type='button'
                      onClick={() => avatarFileRef.current?.click()}
                      disabled={photoUploading}
                      className='absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border-2 border-[#ffffff] bg-[#0e55d9] text-[#ffffff] shadow-sm disabled:opacity-60'>
                      <Camera size={13} strokeWidth={2.5} />
                    </button>
                  </div>

                  {loading ? (
                    <div className='space-y-2 w-full'>
                      <div className='mx-auto h-5 w-36 animate-pulse rounded bg-[#f1f5f9]' />
                      <div className='mx-auto h-3.5 w-28 animate-pulse rounded bg-[#f1f5f9]' />
                    </div>
                  ) : (
                    <>
                      <p className='text-[18px] font-black text-[#0f172a]'>
                        {name}
                      </p>
                      <p className='mt-1 text-[13px] text-[#64748b]'>
                        +91 {customer?.mobile_number ?? "—"}
                      </p>
                      {customer?.email && (
                        <p className='mt-0.5 text-[12px] text-[#94a3b8] truncate max-w-[220px]'>
                          {customer.email}
                        </p>
                      )}
                      <div className='mt-2.5 flex flex-wrap justify-center gap-1.5'>
                        {customer?.mobile_verified && (
                          <span className='inline-flex items-center gap-1 rounded-full bg-[#ecfdf5] px-2.5 py-0.5 text-[10px] font-bold text-[#047857]'>
                            <CheckCircle2 size={10} /> Mobile verified
                          </span>
                        )}
                        {customer?.email_verified && (
                          <span className='inline-flex items-center gap-1 rounded-full bg-[#eff6ff] px-2.5 py-0.5 text-[10px] font-bold text-[#1d4ed8]'>
                            <CheckCircle2 size={10} /> Email verified
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Stats row */}
                <div className='mt-5 grid grid-cols-3 gap-2 border-t border-[#f1f5f9] pt-5'>
                  {[
                    {
                      Icon: CalendarDays,
                      label: "Bookings",
                      value: loading ? "—" : String(bookingCount),
                      href: "/bookings",
                    },
                    {
                      Icon: MapPin,
                      label: "Addresses",
                      value: loading ? "—" : String(addresses.length),
                    },
                    { Icon: BadgeCheck, label: "Member", value: "Active" },
                  ].map(({ Icon, label, value, href }) => {
                    const inner = (
                      <>
                        <Icon
                          size={15}
                          className='text-[#0e55d9]'
                          strokeWidth={1.8}
                        />
                        <p className='mt-1.5 text-[16px] font-black text-[#0f172a]'>
                          {value}
                        </p>
                        <p className='text-[10px] font-medium text-[#94a3b8]'>
                          {label}
                        </p>
                      </>
                    );
                    return href ? (
                      <Link
                        key={label}
                        href={href}
                        className='flex flex-col items-center rounded-xl bg-[#f8fafc] px-2 py-3 text-center transition-colors hover:bg-[#eef4ff]'>
                        {inner}
                      </Link>
                    ) : (
                      <div
                        key={label}
                        className='flex flex-col items-center rounded-xl bg-[#f8fafc] px-2 py-3 text-center'>
                        {inner}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Navigation */}
              <div className='rounded-2xl border border-[#e2e8f0] bg-[#ffffff] p-3 shadow-sm'>
                <p className='mb-2 px-2 text-[10.5px] font-black uppercase tracking-widest text-[#94a3b8]'>
                  Account
                </p>
                <div className='space-y-0.5'>
                  {ACCOUNT_LINKS.map((item) => (
                    <SidebarNav key={item.href} {...item} />
                  ))}
                </div>
              </div>

              {/* Support */}
              <div className='rounded-2xl border border-[#e2e8f0] bg-[#ffffff] p-3 shadow-sm'>
                <p className='mb-2 px-2 text-[10.5px] font-black uppercase tracking-widest text-[#94a3b8]'>
                  Help
                </p>
                <div className='space-y-0.5'>
                  {SUPPORT_LINKS.map((item) => (
                    <SidebarNav key={item.href} {...item} />
                  ))}
                </div>
              </div>

              {/* Logout */}
              <div className='rounded-2xl border border-[#e2e8f0] bg-[#ffffff] p-3 shadow-sm'>
                <SidebarNav
                  icon={LogOut}
                  label='Logout'
                  sub='Sign out of your account'
                  danger
                  onClick={handleLogout}
                />
              </div>
            </aside>

            {/* ── RIGHT: Main content ── */}
            <div className='space-y-6'>
              {/* Saved addresses */}
              <div className='rounded-2xl border border-[#e2e8f0] bg-[#ffffff] shadow-sm overflow-hidden'>
                <div className='flex items-center justify-between border-b border-[#f1f5f9] px-6 py-4'>
                  <div>
                    <p className='text-[15px] font-black text-[#0f172a]'>
                      Saved Addresses
                    </p>
                    <p className='text-[12px] text-[#94a3b8]'>
                      {addresses.length} address
                      {addresses.length !== 1 ? "es" : ""} saved
                    </p>
                  </div>
                  <button
                    type='button'
                    onClick={openModal}
                    className='flex items-center gap-1.5 rounded-xl bg-[#0e55d9] px-4 py-1.5 text-[12.5px] text-[#ffffff] hover:bg-[#0a46b8] transition-all'>
                    Add Address
                  </button>
                </div>

                {loading ? (
                  <div className='grid grid-cols-2 gap-0 p-6 gap-4'>
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className='h-24 animate-pulse rounded-xl bg-[#f1f5f9]'
                      />
                    ))}
                  </div>
                ) : addresses.length === 0 ? (
                  <div className='flex flex-col items-center py-16 text-center'>
                    <div className='flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eef4ff] mb-4'>
                      <MapPin size={28} className='text-[#0e55d9]' />
                    </div>
                    <p className='text-[15px] font-bold text-[#0f172a]'>
                      No addresses saved yet
                    </p>
                    <p className='mt-1 text-[13px] text-[#64748b]'>
                      Add a home or office address for faster booking
                    </p>
                    <button
                      type='button'
                      onClick={openModal}
                      className='mt-5 rounded-xl bg-[#0e55d9] px-6 py-2.5 text-[13px] font-black text-[#ffffff] shadow-sm hover:bg-[#0a46b8] transition-all'>
                      Add Address
                    </button>
                  </div>
                ) : (
                  <>
                    <div className='grid grid-cols-2 gap-0 max-md:grid-cols-1'>
                      {addresses.map((addr, i) => {
                        const label = getAddressLabel(addr);
                        return (
                          <div
                            key={addr.address_id}
                            className={`flex items-start gap-4 p-6 ${i % 2 === 0 && addresses.length > 1 ? "border-r border-[#f1f5f9] max-md:border-r-0" : ""} ${i < addresses.length - 2 ? "border-b border-[#f1f5f9]" : ""} ${i < addresses.length - 1 && addresses.length % 2 !== 0 && i === addresses.length - 2 ? "border-b border-[#f1f5f9]" : ""}`}>
                            <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef4ff]'>
                              <MapPin size={16} className='text-[#0e55d9]' />
                            </div>
                            <div className='min-w-0 flex-1'>
                              <div className='mb-1.5 flex flex-wrap items-center gap-1.5'>
                                <p className='text-[13.5px] font-bold text-[#0f172a]'>
                                  {getAddressDisplayTitle(addr)}
                                </p>
                                <LabelBadge label={label} />
                                {addr.is_selected && (
                                  <span className='rounded-full border border-[#a7f3d0] bg-[#ecfdf5] px-2 py-0.5 text-[9.5px] font-bold text-[#059669]'>
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className='text-[12.5px] leading-relaxed text-[#64748b] line-clamp-2'>
                                {addr.address}
                              </p>
                              <p className='mt-0.5 text-[11.5px] text-[#94a3b8]'>
                                {addr.city}, {addr.state} – {addr.pincode}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <button
                      type='button'
                      onClick={openModal}
                      className='flex w-full items-center justify-between border-t border-[#f1f5f9] px-6 py-3.5 text-[13px] font-semibold text-[#0e55d9] transition-colors hover:bg-[#f8fafc]'>
                      Manage all addresses <ChevronRight size={15} />
                    </button>
                  </>
                )}
              </div>

              {/* Activity / quick stats */}
              <div className='rounded-xl border border-[#e2e8f0] bg-[#ffffff] px-5 py-3 shadow-sm'>
                <div className='flex items-center justify-between divide-x divide-[#f1f5f9]'>
                  {[
                    {
                      Icon: CalendarDays,
                      label: "Bookings",
                      value: loading ? "—" : String(bookingCount),
                      href: "/bookings",
                      color: "#0e55d9",
                      bg: "#eef4ff",
                    },
                    {
                      Icon: MapPin,
                      label: "Addresses",
                      value: loading ? "—" : String(addresses.length),
                      color: "#8b5cf6",
                      bg: "#f5f3ff",
                    },
                    {
                      Icon: Star,
                      label: "Status",
                      value: "Active",
                      color: "#f59e0b",
                      bg: "#fffbeb",
                    },
                  ].map(({ Icon, label, value, href, color, bg }, i) => {
                    const content = (
                      <div
                        className={`flex items-center gap-3 ${i !== 0 ? "pl-6" : ""} ${href ? "group cursor-pointer" : ""}`}>
                        {/* Miniature Icon Box */}
                        <div
                          className='flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105'
                          style={{ background: bg }}>
                          <Icon size={14} style={{ color }} strokeWidth={2} />
                        </div>

                        {/* Compact Data Text */}
                        <div className='min-w-0 leading-tight'>
                          <p className='text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]'>
                            {label}
                          </p>
                          <div className='flex items-center gap-1'>
                            <span className='text-[15px] font-extrabold text-[#0f172a] group-hover:text-[#2563eb] transition-colors'>
                              {value}
                            </span>
                            {href && (
                              <ChevronRight
                                size={12}
                                className='text-[#cbd5e1] transition-transform group-hover:translate-x-0.5'
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    );

                    return href ? (
                      <Link
                        key={label}
                        href={href}
                        className='flex-1 first:flex-none'>
                        {content}
                      </Link>
                    ) : (
                      <div key={label} className='flex-1 first:flex-none'>
                        {content}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent bookings teaser */}
              <div className='rounded-2xl border border-[#e2e8f0] bg-[#ffffff] shadow-sm overflow-hidden'>
                <div className='flex items-center justify-between border-b border-[#f1f5f9] px-6 py-4'>
                  <div>
                    <p className='text-[15px] font-black text-[#0f172a]'>
                      My Bookings
                    </p>
                    <p className='text-[12px] text-[#94a3b8]'>
                      Track and manage your service bookings
                    </p>
                  </div>
                  <Link
                    href='/bookings'
                    className='flex items-center gap-1 text-[13px] font-bold text-[#0e55d9] hover:underline'>
                    View all <ChevronRight size={14} />
                  </Link>
                </div>
                <div className='px-6 py-8 text-center'>
                  <div className='flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef4ff] mx-auto mb-3'>
                    <CalendarDays size={24} className='text-[#0e55d9]' />
                  </div>
                  <p className='text-[14px] font-bold text-[#0f172a]'>
                    {loading
                      ? "Loading…"
                      : bookingCount > 0
                        ? `${bookingCount} booking${bookingCount !== 1 ? "s" : ""} found`
                        : "No bookings yet"}
                  </p>
                  <p className='mt-1 text-[12px] text-[#94a3b8]'>
                    {bookingCount > 0
                      ? "View your booking history and track active services"
                      : "Book your first home service today"}
                  </p>
                  <Link
                    href='/bookings'
                    className='mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0e55d9] px-6 py-2.5 text-[13px] font-black text-[#ffffff] shadow-sm hover:bg-[#0a46b8] transition-all'>
                    {bookingCount > 0 ? "View Bookings" : "Browse Services"}
                  </Link>
                </div>
              </div>

              {/* Footer note */}
              <p className='text-center text-[11.5px] text-[#94a3b8] py-2'>
                eFixMate · Your account is secured with industry-standard
                encryption
              </p>
            </div>
          </div>
        </div>
      </div>

      <EditProfileModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        avatarUrl={avatarUrl}
        initialLetter={initial}
        initial={{
          firstName: customer?.first_name ?? "",
          lastName: customer?.last_name ?? "",
          email: customer?.email ?? "",
        }}
        onSaved={loadData}
      />
    </>
  );
}
