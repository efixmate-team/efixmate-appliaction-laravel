const PREFIX = "efm";

export function encodeId(id: number): string {
  const raw = btoa(`${PREFIX}${id}`);
  return raw.replace(/=/g, "");
}

export function decodeId(encoded: string): number | null {
  try {
    const padded = encoded.padEnd(encoded.length + ((4 - (encoded.length % 4)) % 4), "=");
    const raw = atob(padded);
    if (!raw.startsWith(PREFIX)) return null;
    const n = parseInt(raw.slice(PREFIX.length), 10);
    return isNaN(n) ? null : n;
  } catch {
    return null;
  }
}
