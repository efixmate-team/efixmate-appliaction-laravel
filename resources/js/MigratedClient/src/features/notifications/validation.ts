import type { BroadcastFormValues, ScheduleFormValues, TemplateFormValues } from "./types";

export type ValidationResult = { ok: true } | { ok: false; message: string };

export function validateTemplateForm(values: TemplateFormValues): ValidationResult {
  if (!values.templateKey?.trim()) return { ok: false, message: "Template key is required" };
  if (!values.body?.trim()) return { ok: false, message: "Message body is required" };
  if (!values.channel) return { ok: false, message: "Channel is required" };
  return { ok: true };
}

export function validateBroadcastForm(values: BroadcastFormValues): ValidationResult {
  if (!values.name?.trim()) return { ok: false, message: "Campaign name is required" };
  if (!values.channel) return { ok: false, message: "Channel is required" };
  if (!values.messageBody?.trim() && !values.templateId) {
    return { ok: false, message: "Message body or template is required" };
  }
  return { ok: true };
}

export function validateScheduleForm(values: ScheduleFormValues): ValidationResult {
  if (!values.title?.trim()) return { ok: false, message: "Title is required" };
  if (!values.channel) return { ok: false, message: "Channel is required" };
  if (!values.scheduledAt) return { ok: false, message: "Scheduled date/time is required" };
  return { ok: true };
}

export function parseVariablesInput(raw: string): string[] {
  return raw
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}
