import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { User, Role } from './auth'
import { currentUser, getSession, login as apiLogin, logout as apiLogout, register as apiRegister, issueCode, verifyCode as apiVerifyCode } from './auth'

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
  const [user, setUser] = useState<User | null>(currentUser())

  useEffect(() => {
    setUser(getSession())
  }, [])

  const value = useMemo<AuthCtx>(() => ({
    user,
    async login(email, password) {
      const r = apiLogin(email, password)
      if (r.ok) setUser(getSession())
      return { ok: r.ok, error: (r as any).error }
    },
    logout() { apiLogout(); setUser(null) },
    async register(email, password, role) {
      const r = apiRegister(email, password, role)
      if (!r.ok) return { ok: false, error: r.error }
      const code = issueCode(email)
      return { ok: true, code }
    },
    async requestCode(email) {
      const code = issueCode(email)
      return { ok: true, code }
    },
    async verifyCode(email, code) {
      const r = apiVerifyCode(email, code)
      if (r.ok) setUser(getSession())
      return { ok: r.ok, error: (r as any).error }
    }
  }), [user])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('AuthProvider missing')
  return ctx
}
