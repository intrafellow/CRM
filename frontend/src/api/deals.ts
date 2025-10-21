/**
 * API для работы со сделками
 */
import { apiFetch } from './client'

export interface Deal {
  id: string
  owner_id?: string
  data: Record<string, any>
  created_at: string
  updated_at?: string
}

export interface DealCreate {
  data: Record<string, any>
  owner_id?: string
}

export interface DealUpdate {
  data?: Record<string, any>
}

export interface DealImport {
  deals: Array<Record<string, any>>
  owner_id?: string
}

/**
 * Получить все сделки
 */
export async function getDeals(params?: {
  skip?: number
  limit?: number
  owner_id?: string
}): Promise<Deal[]> {
  const query = new URLSearchParams()
  if (params?.skip !== undefined) query.append('skip', String(params.skip))
  if (params?.limit !== undefined) query.append('limit', String(params.limit))
  if (params?.owner_id) query.append('owner_id', params.owner_id)
  
  const queryString = query.toString()
  return apiFetch<Deal[]>(`/deals${queryString ? `?${queryString}` : ''}`)
}

/**
 * Получить сделку по ID
 */
export async function getDeal(id: string): Promise<Deal> {
  return apiFetch<Deal>(`/deals/${id}`)
}

/**
 * Создать сделку
 */
export async function createDeal(data: DealCreate): Promise<Deal> {
  return apiFetch<Deal>('/deals', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Обновить сделку
 */
export async function updateDeal(id: string, data: DealUpdate): Promise<Deal> {
  return apiFetch<Deal>(`/deals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

/**
 * Удалить сделку
 */
export async function deleteDeal(id: string): Promise<void> {
  return apiFetch<void>(`/deals/${id}`, {
    method: 'DELETE',
  })
}

/**
 * Массовый импорт сделок
 */
export async function importDeals(data: DealImport): Promise<Deal[]> {
  return apiFetch<Deal[]>('/deals/import', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Массовое удаление всех сделок (MVP: для поддержки сценария "показывать только последний импорт")
 */
export async function deleteAllDeals(): Promise<void> {
  await apiFetch<void>('/deals/clear', { method: 'DELETE' })
}

