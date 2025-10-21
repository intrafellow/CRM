/**
 * API клиент для взаимодействия с backend
 */

// Умное определение API URL
function getApiUrl(): string {
  // Если задан явно через переменную окружения
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  
  // Автоматическое определение по hostname
  const hostname = window.location.hostname
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Локальная разработка
    return 'http://localhost:8000/api'
  } else {
    // Продакшен (VM) - через Nginx на порту 80
    return 'http://178.216.103.117/api'
  }
}

// URL backend API
export const API_URL = getApiUrl()

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
    credentials: 'include',
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






