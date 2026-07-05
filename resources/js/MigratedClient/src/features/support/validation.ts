export type ValidationResult = { ok: true } | { ok: false; message: string };

export function validateCreateTicket(values: {
  subject?: string;
  requesterId?: number;
  ticketSource?: string;
}): ValidationResult {
  if (!values.subject?.trim()) return { ok: false, message: "Subject is required" };
  if (!values.requesterId) return { ok: false, message: "Requester ID is required" };
  if (!values.ticketSource) return { ok: false, message: "Ticket source is required" };
  return { ok: true };
}

export function validateReply(message?: string): ValidationResult {
  if (!message?.trim()) return { ok: false, message: "Message is required" };
  return { ok: true };
}

export function validateInternalNote(note?: string): ValidationResult {
  if (!note?.trim()) return { ok: false, message: "Note is required" };
  return { ok: true };
}
