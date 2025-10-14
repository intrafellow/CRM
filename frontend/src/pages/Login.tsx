// frontend/src/pages/Login.tsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, LogIn, Users, Copy, RefreshCw } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { initializeMockUsers } from '../auth/auth'
import AuthShell from '../components/AuthShell'
import GlassCard from '../components/GlassCard'
import AuthInput from '../components/AuthInput'
import PasswordInput from '../components/PasswordInput'
import PillButton from '../components/PillButton'

export default function Login() {
  const nav = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [showMockUsers, setShowMockUsers] = useState(false)

  const mockUsers = [
    { email: 'admin@crm.com', password: 'admin123', role: 'Админ', icon: '👑' },
    { email: 'ivan.petrov@crm.com', password: 'employee123', role: 'Сотрудник', icon: '👤' },
    { email: 'maria.sidorova@crm.com', password: 'employee123', role: 'Сотрудник', icon: '👤' },
    { email: 'alex.kuznetsov@crm.com', password: 'employee123', role: 'Сотрудник', icon: '👤' }
  ]

  function fillCredentials(userEmail: string, userPassword: string) {
    setEmail(userEmail)
    setPassword(userPassword)
    setShowMockUsers(false)
  }

  function resetMockUsers() {
    try {
      // Очищаем localStorage и пересоздаем пользователей
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('auth_users')
        localStorage.removeItem('auth_session')
        localStorage.removeItem('auth_code')
      }
      initializeMockUsers()
      setErr(null)
      console.log('🔄 Моковые пользователи сброшены и пересозданы')
    } catch (error) {
      console.error('Ошибка сброса пользователей:', error)
      setErr('Ошибка сброса пользователей')
    }
  }

  function runDiagnostics() {
    console.log('🔍 === ДИАГНОСТИКА СИСТЕМЫ ===')
    console.log('🌐 Window доступен:', typeof window !== 'undefined')
    console.log('💾 localStorage доступен:', typeof window !== 'undefined' && !!window.localStorage)
    console.log('📊 Текущие пользователи:', localStorage.getItem('auth_users'))
    console.log('🔑 Текущая сессия:', localStorage.getItem('auth_session'))
    console.log('📧 Введенный email:', email)
    console.log('🔒 Введенный пароль:', password ? '***' : '(пустой)')
    
    // Проверяем хеши
    function hash(s: string) {
      let h = 0; 
      for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i) | 0;
      return String(h);
    }
    console.log('🔑 Хеш admin123:', hash('admin123'))
    console.log('🔑 Хеш employee123:', hash('employee123'))
    console.log('🔍 === КОНЕЦ ДИАГНОСТИКИ ===')
  }

  async function submit(e: React.FormEvent){
    e.preventDefault()
    const r = await login(email.trim(), password)
    if (!r.ok) { setErr(r.error || 'Ошибка'); return }
    nav('/')
  }

  return (
    <AuthShell>
      <GlassCard title="Вход" subtitle="Добро пожаловать в CRM Lite">
        {/* Тестовые пользователи */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowMockUsers(!showMockUsers)}
              className="flex items-center gap-2 text-sm text-white/70 hover:text-white/90 transition-colors"
            >
              <Users size={16} />
              Тестовые пользователи
              <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">
                {showMockUsers ? 'скрыть' : 'показать'}
              </span>
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={runDiagnostics}
                className="flex items-center gap-1 text-xs text-white/50 hover:text-white/80 transition-colors"
                title="Запустить диагностику системы"
              >
                🔍 Диагностика
              </button>
              <button
                type="button"
                onClick={resetMockUsers}
                className="flex items-center gap-1 text-xs text-white/50 hover:text-white/80 transition-colors"
                title="Сбросить и пересоздать тестовых пользователей"
              >
                <RefreshCw size={12} />
                Сбросить
              </button>
            </div>
          </div>
          
          {showMockUsers && (
            <div className="mt-3 p-4 glass rounded-lg border border-white/10">
              <div className="text-sm text-white/80 mb-3">Нажмите на пользователя для автозаполнения:</div>
              <div className="grid gap-2">
                {mockUsers.map((user, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => fillCredentials(user.email, user.password)}
                    className="flex items-center justify-between p-2 rounded border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{user.icon}</span>
                      <div>
                        <div className="text-sm font-medium text-white">{user.email}</div>
                        <div className="text-xs text-white/60">Пароль: {user.password}</div>
                      </div>
                    </div>
                    <div className="text-xs bg-white/10 px-2 py-1 rounded-full">
                      {user.role}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <form className="grid gap-5" onSubmit={submit}>
          <AuthInput
            label="E-mail"
            placeholder="you@company.com"
            value={email}
            onChange={setEmail}
            left={<Mail size={18}/>}
          />
          <PasswordInput
            label="Пароль"
            placeholder="••••••••"
            value={password}
            onChange={setPassword}
          />

          {err && <div className="glass pill px-3 py-2 text-red-300">⚠ {err}</div>}

          {/* bottom actions */}
          <div className="flex items-center">
            <Link to="/register" className="inline-block">
              <PillButton
                type="button"
                variant="ghost"
                subtle
                className={
                  // why: маленькая и круглая, спокойная как у Google
                  'rounded-full text-sm px-3 py-1.5 leading-none ' +
                  'border border-white/10 bg-white/5 text-white/80 ' +
                  'hover:bg-white/10 hover:text-white ' +
                  'focus-visible:ring-2 focus-visible:ring-white/30 ' +
                  'active:scale-[.99] transition'
                }
              >
                Создать аккаунт
              </PillButton>
            </Link>

            <div className="ml-auto">
              <PillButton
                type="submit"
                variant="primary"
                className={
                  // why: маленькая, круглая, акцентная
                  'rounded-full text-sm px-3 py-1.5 leading-none group relative overflow-hidden ' +
                  'bg-gradient-to-r from-indigo-500 to-blue-500 text-white ' +
                  'shadow hover:shadow-md hover:-translate-y-px active:translate-y-0 ' +
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ' +
                  'transition'
                }
              >
                <LogIn size={14} className="mr-1.5 inline align-[-2px]" />
                Войти
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-15 transition"
                  style={{
                    background:
                      'radial-gradient(100px 70px at 30% -20%, rgba(255,255,255,.35), transparent 60%)',
                  }}
                />
              </PillButton>
            </div>
          </div>
        </form>
      </GlassCard>
    </AuthShell>
  )
}
