export const CONTACT_HEADER_CANDIDATES = [
  'Source Name','source name',
  'Contact persons','contact persons',
  'Contacted person','contacted person',
  'Contacts','contacts',
  'Contact','contact'
];

export function findHeader(headers: string[], candidates: string[]): string | null {
  const orig = headers ?? [];
  const lower = orig.map(h => String(h ?? '').trim());
  for (const c of candidates) {
    const i = lower.findIndex(h => h.toLowerCase() === c.toLowerCase());
    if (i >= 0) return orig[i];
  }
  for (const c of candidates) {
    const i = lower.findIndex(h => h.toLowerCase().includes(c.toLowerCase()));
    if (i >= 0) return orig[i];
  }
  return null;
}

export function stripInternalKeys<T extends Record<string, unknown>>(row: T) {
  const banned = new Set(['id','_id','_owner','owner','ownerId','_ownerEmail','__meta']);
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(row ?? {})) if (!banned.has(k)) out[k] = (row as any)[k];
  return out as T;
}
