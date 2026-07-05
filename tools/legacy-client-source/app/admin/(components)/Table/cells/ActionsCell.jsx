"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { useMenuPermissions, usePermission } from "@/hooks/usePermission";
import { cn } from "../utils";

const MENU_W = 176;

/**
 * ActionsCell
 * ≤ 2 actions → inline icon buttons
 * > 2 actions → MoreHorizontal dropdown menu (portaled + fixed so table overflow-x does not clip it)
 *
 * @prop {object}   row     - Full row data object
 * @prop {Array}    actions - [{ label, icon, onClick(row), variant?: "danger" }]
 */
export function ActionsCell({ row, actions }) {
  const pathname = usePathname();
  const canCreate = usePermission(pathname, "CREATE");
  const canEdit = usePermission(pathname, "EDIT");
  const canDelete = usePermission(pathname, "DELETE");
  const menuPermissions = useMenuPermissions(pathname);
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const measure = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setCoords({
      top: r.bottom + 4,
      left: Math.max(8, r.right - MENU_W),
    });
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setTimeout(() => setVisible(false), 150);
  }, []);

  const handleOpen = useCallback(() => {
    measure();
    setVisible(true);
    requestAnimationFrame(() => setOpen(true));
  }, [measure]);

  useEffect(() => {
    const onPointerDown = (e) => {
      const t = triggerRef.current;
      const m = menuRef.current;
      if (t?.contains(e.target)) return;
      if (m?.contains(e.target)) return;
      if (visible) handleClose();
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [visible, handleClose]);

  useEffect(() => {
    if (!visible) return;
    measure();
    const onReposition = () => measure();
    window.addEventListener("scroll", onReposition, true);
    window.addEventListener("resize", onReposition);
    return () => {
      window.removeEventListener("scroll", onReposition, true);
      window.removeEventListener("resize", onReposition);
    };
  }, [visible, measure]);

  const actionAllowed = useCallback(
    (action) => {
      if (action?.permission === false) return false;
      const explicit = action?.permission || action?.requiredPermission;
      const label = String(action?.label || "").toLowerCase();
      const customPermission = String(action?.label || "")
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
      const permission = explicit
        ? String(explicit).trim().toUpperCase()
        : menuPermissions.includes(customPermission)
          ? customPermission
          : label.includes("delete")
            ? "DELETE"
            : label.includes("edit") ||
              label.includes("activate") ||
              label.includes("deactivate") ||
              label.includes("verify") ||
              label.includes("approve") ||
              label.includes("refund") ||
              label.includes("confirm") ||
              label.includes("manage") ||
              label.includes("reset") ||
              label.includes("reject")
              ? "EDIT"
              : label.includes("create") || label.includes("add")
                ? "CREATE"
                : "VIEW";
      if (menuPermissions.includes("*")) return true;
      if (!["VIEW", "CREATE", "EDIT", "DELETE"].includes(permission)) {
        return menuPermissions.includes("VIEW") && menuPermissions.includes(permission);
      }
      if (permission === "CREATE") return canCreate;
      if (permission === "EDIT") return canEdit;
      if (permission === "DELETE") return canDelete;
      return true;
    },
    [canCreate, canEdit, canDelete, menuPermissions, pathname]
  );
  const visibleActions = (actions || []).filter((action) => {
    if (typeof action.hidden === "function" && action.hidden(row)) return false;
    if (action.hidden === true) return false;
    return actionAllowed(action);
  });

  if (!visibleActions.length) return null;

  // ── INLINE (≤ 2) ──────────────────────────────────────────────────────────
  if (visibleActions.length <= 2) {
    return (
      <div className="flex items-center gap-0.5">
        {visibleActions.map((action, i) => {
          const Icon = action.icon;
          return (
            <button
              key={i}
              type="button"
              title={action.label}
              onClick={() => action.onClick?.(row)}
              className={cn(
                "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[12px] font-medium cursor-pointer transition-all active:scale-95",
                action.variant === "danger"
                  ? "text-[#7b5757]0 hover:text-[#b91c1c] hover:bg-[#fef2f2]"
                  : "text-[#94a3b8] hover:text-[#334155] hover:bg-[#f1f5f9]"
              )}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{action.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  const menu =
    visible &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        ref={menuRef}
        style={{ top: coords.top, left: coords.left, width: MENU_W }}
        className={cn(
          "fixed z-[200] bg-[#ffffff] rounded-lg border border-[#e2e8f0] shadow-xl shadow-[#e2e8f0]/50 py-1.5 origin-top-right transition-all duration-150 pointer-events-auto",
          open ? "opacity-100 scale-100" : "opacity-0 scale-95"
        )}
      >
        {visibleActions.map((action, i) => {
          const Icon = action.icon;
          return (
            <button
              key={i}
              type="button"
              onClick={() => {
                action.onClick?.(row);
                handleClose();
              }}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-1.5 text-[13px] transition-colors text-left",
                action.variant === "danger"
                  ? "text-[#dc2626] hover:bg-[#fef2f2]"
                  : "text-[#334155] hover:bg-[#f8fafc]"
              )}
            >
              {Icon && <Icon className="w-3.5 h-3.5 opacity-70 shrink-0" />}
              {action.label}
            </button>
          );
        })}
      </div>,
      document.body
    );

  // ── DROPDOWN (> 2) ────────────────────────────────────────────────────────
  return (
    <>
      <div className="relative inline-block text-right">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => (open ? handleClose() : handleOpen())}
          className="p-1.5 rounded-md text-[#94a3b8] hover:text-[#0f172a] hover:bg-[#f1f5f9] transition-all active:scale-95 cursor-pointer"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
      {menu}
    </>
  );
}
