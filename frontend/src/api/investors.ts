import { apiFetch } from './client'

export interface InvestorItem {
  id: string
  owner_id?: string
  data: Record<string, any>
  created_at: string
  updated_at?: string
}

export interface InvestorCreate { data: Record<string, any>; owner_id?: string }
export interface InvestorUpdate { data?: Record<string, any> }
export interface InvestorsImport { items: Array<Record<string, any>>; owner_id?: string }

export async function getInvestors(): Promise<InvestorItem[]> {
  return apiFetch<InvestorItem[]>(`/investors`)
}

export async function createInvestorItem(body: InvestorCreate): Promise<InvestorItem> {
  return apiFetch<InvestorItem>(`/investors`, { method: 'POST', body: JSON.stringify(body) })
}

export async function updateInvestorItem(id: string, body: InvestorUpdate): Promise<InvestorItem> {
  return apiFetch<InvestorItem>(`/investors/${id}`, { method: 'PUT', body: JSON.stringify(body) })
}

export async function deleteInvestorItem(id: string): Promise<null> {
  return apiFetch<null>(`/investors/${id}`, { method: 'DELETE' })
}

export async function clearInvestors(): Promise<null> {
  return apiFetch<null>(`/investors/clear`, { method: 'DELETE' })
}

export async function importInvestors(body: InvestorsImport): Promise<InvestorItem[]> {
  return apiFetch<InvestorItem[]>(`/investors/import`, { method: 'POST', body: JSON.stringify(body) })
}








