"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type MenuPlacement = "I" | "P" | "C";

export type MenuFormValues = {
  menu_name: string;
  menu_path: string;
  menu_icon: string;
  placement: MenuPlacement;
  menu_parent_id: string;
  menu_group_id: string;
  new_group_name: string;
  is_active: boolean;
};

const PLACEMENT_OPTIONS: { value: MenuPlacement; label: string; hint: string }[] = [
  {
    value: "I",
    label: "Regular menu link",
    hint: "A normal item in the sidebar that opens a page.",
  },
  {
    value: "P",
    label: "Section heading",
    hint: "A group title only — use for menus that contain sub-items.",
  },
  {
    value: "C",
    label: "Sub-menu item",
    hint: "Appears inside a section, under a section heading.",
  },
];

const DEFAULT_VALUES: MenuFormValues = {
  menu_name: "",
  menu_path: "",
  menu_icon: "LayoutGrid",
  placement: "I",
  menu_parent_id: "",
  menu_group_id: "",
  new_group_name: "",
  is_active: true,
};

type Option = { id: string | number; label: string };

export default function MenuFormDrawer({
  open,
  mode,
  initial,
  parentOptions,
  groupOptions,
  loading,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  initial?: Partial<MenuFormValues> | null;
  parentOptions: Option[];
  groupOptions: Option[];
  loading?: boolean;
  onClose: () => void;
  onSubmit: (values: MenuFormValues) => void | Promise<void>;
}) {
  const [form, setForm] = useState<MenuFormValues>(DEFAULT_VALUES);
  const [useNewGroup, setUseNewGroup] = useState(false);

  const isEdit = mode === "edit";

  useEffect(() => {
    if (!open) return;
    const next: MenuFormValues = {
      ...DEFAULT_VALUES,
      ...initial,
      placement: (initial?.placement as MenuPlacement) || "I",
    };
    setForm(next);
    setUseNewGroup(!next.menu_group_id && !!next.new_group_name);
  }, [open, initial]);

  const selectedPlacement = PLACEMENT_OPTIONS.find((o) => o.value === form.placement);

  const groupLabel = useMemo(() => {
    if (useNewGroup) return form.new_group_name;
    const g = groupOptions.find((o) => String(o.id) === String(form.menu_group_id));
    return g?.label || "";
  }, [useNewGroup, form.new_group_name, form.menu_group_id, groupOptions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...form,
      menu_path: form.placement === "P" ? form.menu_path || "#" : form.menu_path,
      new_group_name: useNewGroup ? form.new_group_name : groupLabel,
    });
  };

  const set = <K extends keyof MenuFormValues>(key: K, value: MenuFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[120] bg-[#0f172a]/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-[121] flex w-full max-w-md flex-col bg-[#ffffff] shadow-2xl",
          "animate-in slide-in-from-right duration-300"
        )}
        role="dialog"
        aria-labelledby="menu-form-title"
      >
        <div className="flex items-center justify-between border-b border-[#f1f5f9] px-6 py-4">
          <div>
            <h2 id="menu-form-title" className="text-lg font-semibold text-[#0f172a]">
              {isEdit ? "Edit menu" : "Add menu"}
            </h2>
            <p className="text-sm text-[#53697e]">
              {isEdit ? "Update how this item appears in the sidebar." : "Add a new sidebar item for admins."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#334155]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <Field label="Display name" required hint="What admins see in the sidebar.">
              <input
                type="text"
                required
                value={form.menu_name}
                onChange={(e) => set("menu_name", e.target.value)}
                placeholder="e.g. Dashboard"
                className={inputClass}
              />
            </Field>

            {!isEdit && (
              <Field
                label="How should this appear?"
                required
                hint={selectedPlacement?.hint}
              >
                <div className="space-y-2">
                  {PLACEMENT_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
                        form.placement === opt.value
                          ? "border-[#eef2ff] bg-[#6f7790]/60"
                          : "border-[#e2e8f0] hover:border-[#cbd5e1]"
                      )}
                    >
                      <input
                        type="radio"
                        name="placement"
                        value={opt.value}
                        checked={form.placement === opt.value}
                        onChange={() => set("placement", opt.value)}
                        className="mt-1"
                      />
                      <span>
                        <span className="block text-sm font-medium text-[#1e293b]">{opt.label}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </Field>
            )}

            {isEdit && (
              <div className="rounded-lg border border-[#f1f5f9] bg-[#f8fafc] px-3 py-2 text-sm text-[#475569]">
                Type and sidebar section are set at creation and cannot be changed here.
              </div>
            )}

            {!isEdit && form.placement === "C" && (
              <Field label="Under which section?" required>
                <select
                  required
                  value={form.menu_parent_id}
                  onChange={(e) => set("menu_parent_id", e.target.value)}
                  className={inputClass}
                >
                  <option value="">Choose section heading…</option>
                  {parentOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            {!isEdit && (
              <Field
                label="Sidebar section"
                required
                hint="Groups items in the sidebar (e.g. Admin Management, Masters)."
              >
                {!useNewGroup ? (
                  <select
                    required={!useNewGroup}
                    value={form.menu_group_id}
                    onChange={(e) => set("menu_group_id", e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Choose section…</option>
                    {groupOptions.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={form.new_group_name}
                    onChange={(e) => set("new_group_name", e.target.value)}
                    placeholder="e.g. Reports"
                    className={inputClass}
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setUseNewGroup(!useNewGroup);
                    set("menu_group_id", "");
                    set("new_group_name", "");
                  }}
                  className="mt-2 text-xs font-medium text-[#4f46e5] hover:text-[#3730a3]"
                >
                  {useNewGroup ? "Use existing section instead" : "+ Add a new sidebar section"}
                </button>
              </Field>
            )}

            {form.placement !== "P" && (
              <Field
                label="Page URL"
                required
                hint="Path after your domain, usually starts with /admin/"
              >
                <input
                  type="text"
                  required
                  value={form.menu_path}
                  onChange={(e) => set("menu_path", e.target.value)}
                  placeholder="/admin/dashboard"
                  className={inputClass}
                />
              </Field>
            )}

            <Field label="Icon (optional)" hint="Lucide icon name — default is LayoutGrid.">
              <input
                type="text"
                value={form.menu_icon}
                onChange={(e) => set("menu_icon", e.target.value)}
                placeholder="LayoutGrid"
                className={inputClass}
              />
            </Field>

            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#e2e8f0] px-4 py-3">
              <span>
                <span className="block text-sm font-medium text-[#1e293b]">Active</span>
                <span className="text-xs text-[#53697e]">Inactive menus are hidden from the sidebar.</span>
              </span>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => set("is_active", e.target.checked)}
                className="h-5 w-5 rounded border-[#cbd5e1] text-[#4f46e5] focus:ring-[#eef2ff]"
              />
            </label>
          </div>

          <div className="flex gap-3 border-t border-[#f1f5f9] px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-xl border border-[#e2e8f0] py-2.5 text-sm font-semibold text-[#334155] hover:bg-[#f8fafc] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#4f46e5] py-2.5 text-sm font-semibold text-[#ffffff] hover:bg-[#4338ca] disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Add menu"}
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}

const inputClass =
  "w-full rounded-lg border border-[#e2e8f0] px-3 py-2.5 text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:border-[#eef2ff] focus:outline-none focus:ring-2 focus:ring-[#eef2ff]/20";

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-[#334155]">
        {label}
        {required && <span className="text-[#7b5757]"> *</span>}
      </label>
      {hint && <p className="mb-2 text-xs text-[#53697e]">{hint}</p>}
      {children}
    </div>
  );
}
