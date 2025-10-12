import { load } from './storage'

export type ContactRow = {
  id: string; name: string; company?: string; title?: string; email?: string; phone?: string; tags?: string[]
}
export type DealRow = {
  id: string; title: string; contactId?: string; company?: string; owner?: string; amount?: number;
  stage?: string; status?: string; notes?: string; createdAt?: string; updatedAt?: string
}

export const STORE = {
  contacts: 'contacts_data',
  deals: 'deals_data'
}

export function getDataset() {
  const contacts = load<ContactRow[]>(STORE.contacts, [])
  const deals = load<DealRow[]>(STORE.deals, [])
  return { contacts, deals }
}

export function sum<T>(arr: T[], sel: (x: T) => number) {
  return arr.reduce((s, x) => s + (Number(sel(x)) || 0), 0)
}

export function groupCount<T>(rows: T[], key: (x: T) => string | undefined) {
  const m = new Map<string, number>()
  for (const r of rows) {
    const k = (key(r) || 'unknown').trim() || 'unknown'
    m.set(k, (m.get(k) || 0) + 1)
  }
  return Array.from(m, ([k, v]) => ({ key: k, count: v })).sort((a,b)=>b.count-a.count)
}

export function groupSum<T>(rows: T[], key: (x: T) => string | undefined, val: (x: T) => number) {
  const m = new Map<string, number>()
  for (const r of rows) {
    const k = (key(r) || 'unknown').trim() || 'unknown'
    m.set(k, (m.get(k) || 0) + (Number(val(r)) || 0))
  }
  return Array.from(m, ([k, v]) => ({ key: k, value: v })).sort((a,b)=>b.value-a.value)
}

export function monthlySeries(deals: DealRow[]) {
  const m = new Map<string, number>() // YYYY-MM -> sum(amount)
  for (const d of deals) {
    const dt = d.createdAt ? new Date(d.createdAt) : undefined
    if (!dt || Number.isNaN(+dt)) continue
    const key = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`
    m.set(key, (m.get(key) || 0) + (Number(d.amount) || 0))
  }
  return Array.from(m, ([month, amount]) => ({ month, amount })).sort((a,b)=>a.month.localeCompare(b.month))
}

export function kpi(deals: DealRow[]) {
  const totalAmount = sum(deals, d => d.amount || 0)
  const avg = deals.length ? totalAmount / deals.length : 0
  return { totalAmount, avg }
}
