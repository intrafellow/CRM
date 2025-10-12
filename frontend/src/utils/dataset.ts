import { load, save } from './storage'
import { canEditRow } from '../auth/auth'

export const KEYS = {
  // Contacts
  contactPersons: ['Contact persons','Contact person','contact persons','contact person','Контакты','Контакт'],
  contactedPerson: ['Contacted person','contacted person','Связанный контакт'],
  sourceName: ['Source Name','source name','Источник'],
  // Deals
  status: ['Status','status','Статус','статус'],
  type: ['Type','type','Тип','тип'],
  sector: ['Sector','sector','Сектор','сектор'],
  responsible: ['Responsible','responsible','Seniot','Senior','Owner','owner','Ответственный','ответственный','Junior team','Junior','Менеджер']
} as const

export type ContactRow = { id: string; contact: string; ownerId?: string }
export type DealRow = Record<string, unknown> & { id: string; ownerId?: string }

export const STORE = { contacts: 'contacts_data', deals: 'deals_data' }

export function saveRows<T>(key: string, rows: T[]) { save(key, rows) }
export function loadRows<T>(key: string, fallback: T[]): T[] { return load<T>(key, fallback) }

export function pickFirst(row: Record<string,unknown>, candidates: readonly string[]): unknown {
  for (const k of candidates) if (k in row && row[k] != null && row[k] !== '') return row[k]
  return undefined
}
export function uniq<T>(arr: T[]): T[] { return Array.from(new Set(arr)) as T[] }

export function deriveOptions(rows: DealRow[]) {
  const statuses = uniq(rows.map(r => String(pickFirst(r, KEYS.status) ?? '')).filter(Boolean))
  const responsibles = uniq(rows.map(r => String(pickFirst(r, KEYS.responsible) ?? '')).filter(Boolean))
  const sectors = uniq(rows.map(r => String(pickFirst(r, KEYS.sector) ?? '')).filter(Boolean))
  const types = uniq(rows.map(r => String(pickFirst(r, KEYS.type) ?? '')).filter(Boolean))
  return { statuses, responsibles, sectors, types }
}

/** Для UI первого шага фильтров: показываем кнопки-колонки */
export const FILTER_COLUMNS: Array<{key: 'responsible'|'status'|'sector'|'type'; label: string}> = [
  { key: 'responsible', label: 'Responsible' },
  { key: 'status',      label: 'Status' },
  { key: 'sector',      label: 'Sector' },
  { key: 'type',        label: 'Type' }
]

export function rowCanEdit(user: { id: string; role: 'admin'|'employee' } | null, row: { ownerId?: string }) {
  return canEditRow(user as any, row.ownerId)
}
