"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { addCartLinePhotos, removeCartLinePhoto } from "@/lib/api/userClient";
import { photosForCartLine } from "@/lib/booking";
import { resolveUploadUrl } from "@/lib/api/coreClient";

type Props = {
  lineId: string | number;
  photos: string[];
  onChange: (photos: string[]) => void;
};

type PendingPhoto = {
  id: string;
  previewUrl: string;
};

function isBlobUrl(url: string) {
  return url.startsWith("blob:");
}

export function LinePhotoUpload({ lineId, photos, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingPhoto[]>([]);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const pendingRef = useRef<PendingPhoto[]>([]);

  pendingRef.current = pending;

  useEffect(() => {
    return () => {
      pendingRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
  }, []);

  const revokePending = (items: PendingPhoto[]) => {
    items.forEach((p) => URL.revokeObjectURL(p.previewUrl));
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError("");

    const slotsLeft = Math.max(0, 4 - photos.length - pending.length);
    const batch = Array.from(files).slice(0, slotsLeft);
    if (!batch.length) return;

    const optimistic: PendingPhoto[] = batch.map((file) => ({
      id: `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      previewUrl: URL.createObjectURL(file),
    }));

    setPending((prev) => [...prev, ...optimistic]);

    const fd = new FormData();
    for (const file of batch) {
      fd.append("photos", file);
    }

    try {
      const res = await addCartLinePhotos(lineId, fd);
      if ((res as { status?: boolean }).status === false) {
        setPending((prev) => {
          const next = prev.filter((p) => !optimistic.some((o) => o.id === p.id));
          revokePending(optimistic);
          return next;
        });
        setError((res as { message?: string }).message || "Upload failed. Try again.");
        return;
      }

      const uploaded = photosForCartLine(res, lineId);
      revokePending(optimistic);
      setPending((prev) => prev.filter((p) => !optimistic.some((o) => o.id === p.id)));

      if (uploaded.length) {
        onChange(uploaded.slice(0, 4));
      } else {
        setError("Upload completed but photos did not appear. Refresh and try again.");
      }
    } catch {
      setPending((prev) => {
        const next = prev.filter((p) => !optimistic.some((o) => o.id === p.id));
        revokePending(optimistic);
        return next;
      });
      setError("Could not upload photos. Check your connection and try again.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async (url: string, pendingId?: string) => {
    setError("");

    if (pendingId) {
      setPending((prev) => {
        const item = prev.find((p) => p.id === pendingId);
        if (item) URL.revokeObjectURL(item.previewUrl);
        return prev.filter((p) => p.id !== pendingId);
      });
      return;
    }

    const previous = photos;
    onChange(photos.filter((p) => p !== url));

    try {
      const res = await removeCartLinePhoto(lineId, url);
      if ((res as { status?: boolean }).status === false) {
        onChange(previous);
        setError((res as { message?: string }).message || "Could not remove photo.");
        return;
      }
      const remaining = photosForCartLine(res, lineId);
      onChange(remaining);
    } catch {
      onChange(previous);
      setError("Could not remove photo.");
    }
  };

  const totalCount = photos.length + pending.length;
  const canAddMore = totalCount < 4;

  return (
    <div className="mt-3">
      <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-[#5c6a7f]">
        Photos (optional)
      </p>
      <div className="flex flex-wrap gap-2">
        {photos.map((url) => {
          const src = isBlobUrl(url) ? url : resolveUploadUrl(url);
          return (
            <div
              key={url}
              className="group relative h-16 w-16 overflow-hidden rounded-xl border border-[#e2e8f0] transition-all duration-200"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                className="h-full w-full object-cover cursor-pointer"
                onClick={() => setPreview(src)}
              />
              <button
                type="button"
                onClick={() => handleRemove(url)}
                className="absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-[#000000]/60 text-[#ffffff] opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X size={10} />
              </button>
            </div>
          );
        })}

        {pending.map((item) => (
          <div
            key={item.id}
            className="relative h-16 w-16 overflow-hidden rounded-xl border border-[#0e55d9]/30 transition-all duration-200"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-[#0e55d9]/20 backdrop-blur-[1px]">
              <Loader2 size={18} className="animate-spin text-[#ffffff] drop-shadow" />
            </div>
            <button
              type="button"
              onClick={() => handleRemove(item.previewUrl, item.id)}
              className="absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-[#000000]/60 text-[#ffffff]"
            >
              <X size={10} />
            </button>
          </div>
        ))}

        {canAddMore && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[#cbd5e1] bg-[#f8fafc] text-[#64748b] transition-colors hover:border-[#0e55d9] hover:text-[#0e55d9]"
          >
            <Camera size={16} />
            <span className="text-[8px] font-bold">Upload</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {error && <p className="mt-1.5 text-[10px] font-semibold text-[#7b5757]">{error}</p>}
      <p className="mt-1.5 text-[10px] text-[#5c6a7f]">Help the technician understand the issue beforehand</p>

      {preview && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#000000]/70 p-4"
          onClick={() => setPreview(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="max-h-[80vh] max-w-full rounded-2xl object-contain" />
        </div>
      )}
    </div>
  );
}