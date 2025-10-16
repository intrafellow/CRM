/**
 * API клиент для взаимодействия с backend
 */

// URL backend API
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

// Типы для API
export interface ApiError {
  detail: string | { msg: string; type: string }[]
}

// Хранение токена
const TOKEN_KEY = 'api_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

/**
 * Базовый fetch с автоматической обработкой ошибок и авторизацией
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })
  
  // Если 401 - токен невалиден, очищаем его
  if (response.status === 401) {
    clearToken()
  }
  
  // Обработка ошибок
  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      detail: `HTTP ${response.status}: ${response.statusText}`
    }))
    
    const message = typeof error.detail === 'string' 
      ? error.detail 
      : error.detail?.[0]?.msg || 'Неизвестная ошибка'
    
    throw new Error(message)
  }
  
  // 204 No Content - возвращаем null
  if (response.status === 204) {
    return null as T
  }
  
  return response.json()
}



