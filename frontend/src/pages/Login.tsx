// frontend/src/pages/Login.tsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, LogIn } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
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

  async function submit(e: React.FormEvent){
    e.preventDefault()
    const r = await login(email.trim(), password)
    if (!r.ok) { setErr(r.error || 'Ошибка'); return }
    nav('/')
  }

  return (
    <AuthShell>
      <GlassCard title="Вход" subtitle="Добро пожаловать в CRM Lite">
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
