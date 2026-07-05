export function parseTechnicianIds(raw: string): number[] {
  return [...new Set(raw.split(/[,\s]+/).map((s) => Number(s.trim())).filter((n) => n > 0))];
}

export function validateReschedule(scheduledDate: string): string | null {
  if (!scheduledDate) return "Scheduled date is required";
  return null;
}

export function validateInternalNote(note: string): string | null {
  if (!note.trim()) return "Note cannot be empty";
  return null;
}
