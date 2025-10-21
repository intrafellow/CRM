import { apiFetch } from './client'

export interface AdvisorItem {
  id: string
  owner_id?: string
  data: Record<string, any>
  created_at: string
  updated_at?: string
}

export interface AdvisorCreate { data: Record<string, any>; owner_id?: string }
export interface AdvisorUpdate { data?: Record<string, any> }
export interface AdvisorsImport { items: Array<Record<string, any>>; owner_id?: string }

export async function getAdvisors(): Promise<AdvisorItem[]> {
  return apiFetch<AdvisorItem[]>(`/advisors`)
}

export async function createAdvisorItem(body: AdvisorCreate): Promise<AdvisorItem> {
  return apiFetch<AdvisorItem>(`/advisors`, { method: 'POST', body: JSON.stringify(body) })
}

export async function updateAdvisorItem(id: string, body: AdvisorUpdate): Promise<AdvisorItem> {
  return apiFetch<AdvisorItem>(`/advisors/${id}`, { method: 'PUT', body: JSON.stringify(body) })
}

export async function deleteAdvisorItem(id: string): Promise<null> {
  return apiFetch<null>(`/advisors/${id}`, { method: 'DELETE' })
}

export async function clearAdvisors(): Promise<null> {
  return apiFetch<null>(`/advisors/clear`, { method: 'DELETE' })
}

export async function importAdvisors(body: AdvisorsImport): Promise<AdvisorItem[]> {
  return apiFetch<AdvisorItem[]>(`/advisors/import`, { method: 'POST', body: JSON.stringify(body) })
}








