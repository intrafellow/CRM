export type Role = 'admin' | 'employee'

export type User = {
  id: string
  email: string
  passwordHash: string
  role: Role
  verified: boolean
}

export type PendingCode = {
  email: string
  code: string
  expiresAt: number
}

const LS = {
  users: 'auth_users',
  session: 'auth_session',
  code: 'auth_code',
}

function getUsers(): User[] {
  try { return JSON.parse(localStorage.getItem(LS.users) || '[]') } catch { return [] }
}
function setUsers(users: User[]) {
  localStorage.setItem(LS.users, JSON.stringify(users))
}
function hash(s: string) {
  // why: на фронте делаем простейший hash; в проде — bcrpyt/argon2 на бэке
  let h = 0; for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i) | 0
  return String(h)
}

export function currentUser(): User | null {
  try { return JSON.parse(localStorage.getItem(LS.session) || 'null') } catch { return null }
}
function setSession(u: User | null) {
  if (u) localStorage.setItem(LS.session, JSON.stringify(u))
  else localStorage.removeItem(LS.session)
}

export function register(email: string, password: string, role: Role): { ok: true } | { ok: false, error: string, code?: string } {
  const users = getUsers()
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return { ok: false, error: 'Пользователь уже существует' }
  }
  const u: User = {
    id: `u_${Date.now()}`,
    email,
    passwordHash: hash(password),
    role,
    verified: false
  }
  users.push(u); setUsers(users)
  const code = issueCode(email)
  // имитируем отправку кода "на почту": возвращаем код, чтобы показать пользователю
  return { ok: true }
}

export function login(email: string, password: string): { ok: true } | { ok: false, error: string } {
  const users = getUsers()
  const u = users.find(x => x.email.toLowerCase() === email.toLowerCase())
  if (!u) return { ok: false, error: 'Неверные учётные данные' }
  if (u.passwordHash !== hash(password)) return { ok: false, error: 'Неверные учётные данные' }
  if (!u.verified) return { ok: false, error: 'Аккаунт не подтверждён. Проверьте e-mail и введите код.' }
  setSession(u)
  return { ok: true }
}

export function logout() { setSession(null) }

export function issueCode(email: string): string {
  const code = String(Math.floor(100000 + Math.random()*900000))
  const expiresAt = Date.now() + 10 * 60 * 1000
  const payload: PendingCode = { email, code, expiresAt }
  localStorage.setItem(LS.code, JSON.stringify(payload))
  return code
}

export function verifyCode(email: string, code: string): { ok: true } | { ok: false, error: string } {
  const raw = localStorage.getItem(LS.code)
  if (!raw) return { ok: false, error: 'Код не запрошен' }
  const payload: PendingCode = JSON.parse(raw)
  if (payload.email.toLowerCase() !== email.toLowerCase()) return { ok: false, error: 'Другой e-mail' }
  if (Date.now() > payload.expiresAt) return { ok: false, error: 'Код истёк' }
  if (payload.code !== code) return { ok: false, error: 'Неверный код' }

  const users = getUsers()
  const i = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase())
  if (i === -1) return { ok: false, error: 'Пользователь не найден' }
  users[i].verified = true
  setUsers(users)
  localStorage.removeItem(LS.code)
  setSession(users[i])
  return { ok: true }
}

export function getSession(): User | null { return currentUser() }

export function requireRole(u: User | null, role: Role): boolean {
  if (!u) return false
  return role === 'admin' ? u.role === 'admin' : true
}

export function canEditRow(u: User | null, ownerId?: string): boolean {
  if (!u) return false
  if (u.role === 'admin') return true
  return !!ownerId && ownerId === u.id
}
