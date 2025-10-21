import { apiFetch } from './client'

export interface CompanyItem {
  id: string
  owner_id?: string
  data: Record<string, any>
  created_at: string
  updated_at?: string
}

export interface CompanyCreate { data: Record<string, any>; owner_id?: string }
export interface CompanyUpdate { data?: Record<string, any> }
export interface CompaniesImport { items: Array<Record<string, any>>; owner_id?: string }

export async function getCompanies(): Promise<CompanyItem[]> {
  return apiFetch<CompanyItem[]>(`/companies`)
}

export async function createCompanyItem(body: CompanyCreate): Promise<CompanyItem> {
  return apiFetch<CompanyItem>(`/companies`, { method: 'POST', body: JSON.stringify(body) })
}

export async function updateCompanyItem(id: string, body: CompanyUpdate): Promise<CompanyItem> {
  return apiFetch<CompanyItem>(`/companies/${id}`, { method: 'PUT', body: JSON.stringify(body) })
}

export async function deleteCompanyItem(id: string): Promise<null> {
  return apiFetch<null>(`/companies/${id}`, { method: 'DELETE' })
}

export async function clearCompanies(): Promise<null> {
  return apiFetch<null>(`/companies/clear`, { method: 'DELETE' })
}

export async function importCompanies(body: CompaniesImport): Promise<CompanyItem[]> {
  return apiFetch<CompanyItem[]>(`/companies/import`, { method: 'POST', body: JSON.stringify(body) })
}








