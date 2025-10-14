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
  try { 
    if (typeof window === 'undefined' || !window.localStorage) return []
    return JSON.parse(localStorage.getItem(LS.users) || '[]') 
  } catch { return [] }
}
function setUsers(users: User[]) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return
    localStorage.setItem(LS.users, JSON.stringify(users))
  } catch (e) {
    console.error('Ошибка сохранения пользователей:', e)
  }
}
function hash(s: string) {
  // why: на фронте делаем простейший hash; в проде — bcrpyt/argon2 на бэке
  let h = 0; for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i) | 0
  return String(h)
}

export function currentUser(): User | null {
  try { 
    if (typeof window === 'undefined' || !window.localStorage) return null
    return JSON.parse(localStorage.getItem(LS.session) || 'null') 
  } catch { return null }
}
function setSession(u: User | null) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return
    if (u) localStorage.setItem(LS.session, JSON.stringify(u))
    else localStorage.removeItem(LS.session)
  } catch (e) {
    console.error('Ошибка сохранения сессии:', e)
  }
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
  console.log('🔐 Попытка входа:', { email, password: '***' })
  const users = getUsers()
  console.log('👥 Все пользователи:', users)
  
  const u = users.find(x => x.email.toLowerCase() === email.toLowerCase())
  console.log('🔍 Найденный пользователь:', u)
  
  if (!u) {
    console.log('❌ Пользователь не найден')
    return { ok: false, error: 'Неверные учётные данные' }
  }
  
  const passwordHash = hash(password)
  console.log('🔑 Хеш введенного пароля:', passwordHash)
  console.log('🔑 Хеш в базе:', u.passwordHash)
  console.log('✅ Хеши совпадают:', u.passwordHash === passwordHash)
  
  if (u.passwordHash !== passwordHash) {
    console.log('❌ Неверный пароль')
    return { ok: false, error: 'Неверные учётные данные' }
  }
  
  if (!u.verified) {
    console.log('❌ Аккаунт не подтвержден')
    return { ok: false, error: 'Аккаунт не подтверждён. Проверьте e-mail и введите код.' }
  }
  
  console.log('✅ Успешный вход')
  setSession(u)
  return { ok: true }
}

export function logout() { setSession(null) }

export function issueCode(email: string): string {
  const code = String(Math.floor(100000 + Math.random()*900000))
  const expiresAt = Date.now() + 10 * 60 * 1000
  const payload: PendingCode = { email, code, expiresAt }
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(LS.code, JSON.stringify(payload))
    }
  } catch (e) {
    console.error('Ошибка сохранения кода:', e)
  }
  return code
}

export function verifyCode(email: string, code: string): { ok: true } | { ok: false, error: string } {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { ok: false, error: 'localStorage недоступен' }
    }
    
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
  } catch (e) {
    console.error('Ошибка верификации кода:', e)
    return { ok: false, error: 'Ошибка верификации' }
  }
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

// Моковые данные для тестирования
export function initializeMockUsers(): void {
  try {
    console.log('🔄 Инициализация моковых пользователей...')
    
    // Проверяем доступность localStorage
    if (typeof window === 'undefined' || !window.localStorage) {
      console.log('⚠️ localStorage недоступен, пропускаем инициализацию')
      return
    }
    
    const users = getUsers()
    console.log('📊 Текущие пользователи в localStorage:', users)
    
    // Проверяем, есть ли уже пользователи
    if (users.length > 0) {
      console.log('⚠️ Пользователи уже существуют, пропускаем инициализацию моковых данных')
      return
    }

    const mockUsers: User[] = [
      {
        id: 'admin_001',
        email: 'admin@crm.com',
        passwordHash: hash('admin123'),
        role: 'admin',
        verified: true
      },
      {
        id: 'emp_001',
        email: 'ivan.petrov@crm.com',
        passwordHash: hash('employee123'),
        role: 'employee',
        verified: true
      },
      {
        id: 'emp_002',
        email: 'maria.sidorova@crm.com',
        passwordHash: hash('employee123'),
        role: 'employee',
        verified: true
      },
      {
        id: 'emp_003',
        email: 'alex.kuznetsov@crm.com',
        passwordHash: hash('employee123'),
        role: 'employee',
        verified: true
      }
    ]

    setUsers(mockUsers)
    console.log('✅ Моковые пользователи инициализированы:')
    console.log('👑 Админ: admin@crm.com / admin123 (hash:', hash('admin123'), ')')
    console.log('👤 Сотрудник 1: ivan.petrov@crm.com / employee123 (hash:', hash('employee123'), ')')
    console.log('👤 Сотрудник 2: maria.sidorova@crm.com / employee123')
    console.log('👤 Сотрудник 3: alex.kuznetsov@crm.com / employee123')
    console.log('💾 Сохранено в localStorage:', JSON.stringify(mockUsers, null, 2))
  } catch (error) {
    console.error('❌ Ошибка инициализации моковых пользователей:', error)
  }
}
