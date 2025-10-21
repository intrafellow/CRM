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
    { email: 'admin@crm.com', password: 'admin123', role: 'Admin', icon: '👑' },
    { email: 'ivan.petrov@crm.com', password: 'employee123', role: 'Employee', icon: '👤' },
    { email: 'maria.sidorova@crm.com', password: 'employee123', role: 'Employee', icon: '👤' },
    { email: 'alex.kuznetsov@crm.com', password: 'employee123', role: 'Employee', icon: '👤' }
  ]

  function fillCredentials(userEmail: string, userPassword: string) {
    setEmail(userEmail)
    setPassword(userPassword)
    setShowMockUsers(false)
  }

  function resetMockUsers() {
    try {
      // Clear localStorage and recreate users
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('auth_users')
        localStorage.removeItem('auth_session')
        localStorage.removeItem('auth_code')
      }
      initializeMockUsers()
      setErr(null)
      console.log('🔄 Mock users reset & recreated')
    } catch (error) {
      console.error('Mock users reset failed:', error)
      setErr('Mock users reset failed')
    }
  }

  function runDiagnostics() {
    console.log('🔍 === DIAGNOSTICS ===')
    console.log('🌐 Window:', typeof window !== 'undefined')
    console.log('💾 localStorage:', typeof window !== 'undefined' && !!window.localStorage)
    console.log('📊 Users:', localStorage.getItem('auth_users'))
    console.log('🔑 Session:', localStorage.getItem('auth_session'))
    console.log('📧 Email:', email)
    console.log('🔒 Password:', password ? '***' : '(empty)')
    
    // Проверяем хеши
    function hash(s: string) {
      let h = 0; 
      for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i) | 0;
      return String(h);
    }
    console.log('🔑 Hash admin123:', hash('admin123'))
    console.log('🔑 Hash employee123:', hash('employee123'))
    console.log('🔍 === END DIAGNOSTICS ===')
  }

  async function submit(e: React.FormEvent){
    e.preventDefault()
    const r = await login(email.trim(), password)
    if (!r.ok) { setErr(r.error || 'Login error'); return }
    nav('/')
  }

  return (
    <AuthShell>
      <GlassCard title="Sign in" subtitle="Welcome to CRM Lite">
        {/* Тестовые пользователи */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowMockUsers(!showMockUsers)}
              className="flex items-center gap-2 text-sm text-slate-700 hover:text-slate-900 transition-colors"
            >
              <Users size={16} />
              Test users
              <span className="text-xs bg-black/10 px-2 py-0.5 rounded-full">
                {showMockUsers ? 'hide' : 'show'}
              </span>
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={runDiagnostics}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                title="Run diagnostics"
              >
                🔍 Diagnostics
              </button>
              <button
                type="button"
                onClick={resetMockUsers}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                title="Reset and recreate test users"
              >
                <RefreshCw size={12} />
                Reset
              </button>
            </div>
          </div>
          
          {showMockUsers && (
            <div className="mt-3 p-4 glass rounded-lg border border-black/10">
              <div className="text-sm text-slate-700 mb-3">Click a user to autofill:</div>
              <div className="grid gap-2">
                {mockUsers.map((user, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => fillCredentials(user.email, user.password)}
                    className="flex items-center justify-between p-2 rounded border border-black/10 hover:border-black/20 hover:bg-black/5 transition-all text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{user.icon}</span>
                      <div>
                        <div className="text-sm font-medium text-slate-900">{user.email}</div>
                        <div className="text-xs text-slate-600">Password: {user.password}</div>
                      </div>
                    </div>
                    <div className="text-xs bg-black/10 px-2 py-1 rounded-full">
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
            label="Password"
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
                  // why: маленькая и круглая, спокойная как у Google (светлая тема)
                  'rounded-full text-sm px-3 py-1.5 leading-none ' +
                  'border border-black/20 bg-transparent text-slate-700 ' +
                  'hover:bg-black/5 hover:text-slate-900 ' +
                  'focus-visible:ring-2 focus-visible:ring-black/20 ' +
                  'active:scale-[.99] transition'
                }
              >
                Create account
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
                Sign in
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
