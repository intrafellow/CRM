import { saveRows, STORE, ContactRow, DealRow } from './dataset'
import { findHeader, CONTACT_HEADER_CANDIDATES } from './headers'

export function saveRowsAndNotify<T>(storeKey: string, rows: T[]) {
  saveRows(storeKey as any, rows as any)
  try { window.dispatchEvent(new CustomEvent('store-updated', { detail: { key: storeKey } })) } catch {}
  try { localStorage.setItem('__store_updated__', `${storeKey}:${Date.now()}`) } catch {}
}

export function subscribeStore(keys: string[], cb: ()=>void): ()=>void {
  const onCustom = (e: Event) => { const d = (e as CustomEvent).detail; if (d?.key && keys.includes(d.key)) cb() }
  const onStorage = (e: StorageEvent) => {
    if (e.key === '__store_updated__') { const k = String(e.newValue || '').split(':')[0]; if (keys.includes(k)) cb() }
  }
  window.addEventListener('store-updated', onCustom as any)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener('store-updated', onCustom as any)
    window.removeEventListener('storage', onStorage)
  }
}

/** Извлечь контакты из сделок и пометить владельца */
export function deriveContactsFromDeals(rows: Array<Record<string, unknown>>, ownerId?: string): ContactRow[] {
  const out: ContactRow[] = []
  const seen = new Set<string>()
  for (const r of rows ?? []) {
    const headers = Object.keys(r ?? {})
    const key = findHeader(headers, CONTACT_HEADER_CANDIDATES)
    const raw = key ? (r as any)[key] : undefined
    const parts = String(raw ?? '')
      .split(/[,;/]| и | \/ /i)
      .map(s => s.trim())
      .filter(Boolean)
    for (const name of parts) {
      const k = name.toLowerCase()
      if (!k || seen.has(k)) continue
      seen.add(k)
      out.push({ id: `c_${Math.random().toString(36).slice(2)}`, contact: name, ownerId } as ContactRow)
    }
  }
  return out
}

/** Сделки → Контакты (REPLACE, с ownerId загрузившего) */
export function replaceContactsFromDeals(importedDeals: Array<Record<string, unknown>>, ownerId?: string) {
  const derived = deriveContactsFromDeals(importedDeals, ownerId)
  saveRowsAndNotify(STORE.contacts, derived)
}

/** Контакты → Сделки (REPLACE, с ownerId загрузившего) */
export function replaceDealsFromContacts(importedRows: Array<Record<string, unknown>>, ownerId?: string) {
  const base = Date.now()
  const stamped = (importedRows ?? []).map((r, i) => ({
    id: (r as any)?.id ?? `d_${base}_${i}`,
    ownerId,
    ...r
  })) as DealRow[]
  saveRowsAndNotify(STORE.deals, stamped as any)
}
