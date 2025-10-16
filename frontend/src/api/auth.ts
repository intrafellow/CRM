/**
 * API для аутентификации
 */
import { apiFetch, setToken, clearToken } from './client'

export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'employee'
  verified: boolean
  created_at: string
  updated_at?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
  role?: 'admin' | 'employee'
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user: User
}

/**
 * Вход в систему
 */
export async function login(credentials: LoginRequest): Promise<User> {
  const response = await apiFetch<TokenResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
  
  setToken(response.access_token)
  return response.user
}

/**
 * Регистрация
 */
export async function register(data: RegisterRequest): Promise<User> {
  const response = await apiFetch<TokenResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  
  setToken(response.access_token)
  return response.user
}

/**
 * Получить данные текущего пользователя
 */
export async function getMe(): Promise<User> {
  return apiFetch<User>('/auth/me')
}

/**
 * Выход из системы
 */
export async function logout(): Promise<void> {
  try {
    await apiFetch('/auth/logout', { method: 'POST' })
  } finally {
    clearToken()
  }
}



