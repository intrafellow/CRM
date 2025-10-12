import type { Contact, Deal } from '../domain/types'
import { DealStatus, Tag } from '../domain/enums'

export type ContactFilters = { tags?: Tag[]; q?: string }
export type DealFilters = { status?: DealStatus[]; owner?: string[]; q?: string }

export function searchContacts(items: Contact[], { q }: ContactFilters) {
  if (!q) return items
  const s = q.trim().toLowerCase()
  return items.filter(i =>
    [i.name, i.company, i.title, i.email, i.phone].some(v => (v ?? '').toLowerCase().includes(s))
  )
}
export function filterContacts(items: Contact[], { tags }: ContactFilters) {
  if (!tags?.length) return items
  return items.filter(i => tags.every(t => i.tags.includes(t)))
}
export function searchDeals(items: Deal[], { q }: DealFilters) {
  if (!q) return items
  const s = q.trim().toLowerCase()
  return items.filter(i =>
    [i.title, i.company, i.owner, i.notes].some(v => (v ?? '').toLowerCase().includes(s))
  )
}
export function filterDeals(items: Deal[], { status, owner }: DealFilters) {
  return items.filter(i => {
    const okStatus = !status?.length || status.includes(i.status)
    const okOwner = !owner?.length || owner.includes(i.owner ?? '')
    return okStatus && okOwner
  })
}
