/**
 * API для работы с контактами
 */
import { apiFetch } from './client'

export interface Contact {
  id: string
  contact: string
  owner_id?: string
  created_at: string
  updated_at?: string
}

export interface ContactCreate {
  contact: string
  owner_id?: string
}

export interface ContactUpdate {
  contact?: string
}

export interface ContactImport {
  contacts: Array<Record<string, any>>
  owner_id?: string
}

/**
 * Получить все контакты
 */
export async function getContacts(params?: {
  skip?: number
  limit?: number
  owner_id?: string
  search?: string
}): Promise<Contact[]> {
  const query = new URLSearchParams()
  if (params?.skip !== undefined) query.append('skip', String(params.skip))
  if (params?.limit !== undefined) query.append('limit', String(params.limit))
  if (params?.owner_id) query.append('owner_id', params.owner_id)
  if (params?.search) query.append('search', params.search)
  
  const queryString = query.toString()
  return apiFetch<Contact[]>(`/contacts${queryString ? `?${queryString}` : ''}`)
}

/**
 * Получить контакт по ID
 */
export async function getContact(id: string): Promise<Contact> {
  return apiFetch<Contact>(`/contacts/${id}`)
}

/**
 * Создать контакт
 */
export async function createContact(data: ContactCreate): Promise<Contact> {
  return apiFetch<Contact>('/contacts', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * Обновить контакт
 */
export async function updateContact(id: string, data: ContactUpdate): Promise<Contact> {
  return apiFetch<Contact>(`/contacts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

/**
 * Удалить контакт
 */
export async function deleteContact(id: string): Promise<void> {
  return apiFetch<void>(`/contacts/${id}`, {
    method: 'DELETE',
  })
}

/**
 * Массовый импорт контактов
 */
export async function importContacts(data: ContactImport): Promise<Contact[]> {
  return apiFetch<Contact[]>('/contacts/import', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}



