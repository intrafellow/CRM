import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Role } from './auth'
import * as API from '../api'

// Используем типы из API
type User = API.User & { role: Role }

type AuthCtx = {
  user: User | null
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => void
  register: (email: string, password: string, role: Role) => Promise<{ ok: boolean; error?: string; code?: string }>
  requestCode: (email: string) => Promise<{ ok: boolean; code?: string }>
  verifyCode: (email: string, code: string) => Promise<{ ok: boolean; error?: string }>
}

const Ctx = createContext<AuthCtx | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Проверяем есть ли сохраненный токен и валиден ли он
  useEffect(() => {
    const token = API.getToken()
    if (token) {
      API.getMe()
        .then(u => setUser(u as User))
        .catch(() => {
          // Токен невалиден, очищаем
          API.clearToken()
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const value = useMemo<AuthCtx>(() => ({
    user,
    async login(email, password) {
      try {
        const apiUser = await API.login({ email, password })
        setUser(apiUser as User)
        return { ok: true }
      } catch (error: any) {
        return { ok: false, error: error.message || 'Ошибка входа' }
      }
    },
    logout() { 
      API.logout().finally(() => setUser(null))
    },
    async register(email, password, role) {
      try {
        const apiUser = await API.register({ email, password, name: email.split('@')[0], role })
        setUser(apiUser as User)
        // В backend нет верификации по коду, возвращаем success
        return { ok: true }
      } catch (error: any) {
        return { ok: false, error: error.message || 'Ошибка регистрации' }
      }
    },
    async requestCode(email) {
      // Backend не использует коды верификации, возвращаем заглушку
      return { ok: true, code: '000000' }
    },
    async verifyCode(email, code) {
      // Backend не использует коды верификации
      return { ok: true }
    }
  }), [user])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-white">Загрузка...</div>
    </div>
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('AuthProvider missing')
  return ctx
}
