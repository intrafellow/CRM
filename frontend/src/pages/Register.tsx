// frontend/src/pages/Register.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, UserPlus } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import type { Role } from '../auth/auth'
import AuthShell from '../components/AuthShell'
import GlassCard from '../components/GlassCard'
import AuthInput from '../components/AuthInput'
import PasswordInput from '../components/PasswordInput'
import PillButton from '../components/PillButton'

export default function Register() {
  const nav = useNavigate()
  const { register } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('employee')
  const [err, setErr] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const r = await register(email.trim(), password, role)
    if (!r.ok) { setErr(r.error || 'Registration error'); return }
    nav('/verify?email=' + encodeURIComponent(email))
  }

  // why: базовое состояние гасим явно, выбранное подсвечиваем
  const pillSpan =
    'pill px-4 py-2 glass border transition-all duration-150 select-none ' +
    'border-white/30 bg-transparent ring-0 ' + // сброс неактивного
    'hover:ring-indigo-400 ' +
    'peer-focus-visible:ring-2 peer-focus-visible:ring-white/40 ' +
    'peer-checked:bg-indigo-500/20 peer-checked:ring-indigo-400 peer-checked:ring-2 peer-checked:ring-indigo-400 ' +
    'peer-checked:shadow-[0_8px_24px_rgba(255,255,255,.14)]'

  return (
    <AuthShell>
      <GlassCard title="Sign up" subtitle="Choose role: admin or employee">
        <form className="grid gap-5" onSubmit={submit}>
          <AuthInput
            label="E-mail"
            placeholder="you@company.com"
            value={email}
            onChange={setEmail}
            left={<Mail size={18} />}
          />
          <PasswordInput
            label="Password"
            placeholder="Minimum 8 characters"
            value={password}
            onChange={setPassword}
          />

          <div className="grid gap-1">
            <span className="small">Role</span>
            <div role="radiogroup" aria-label="Role" className="flex gap-2">
              {/* Сотрудник */}
              <label className="cursor-pointer">
                <input
                  type="radio"
                  name="role" /* один name => взаимоисключаемость */
                  value="employee"
                  className="peer sr-only"
                  checked={role === 'employee'}
                  onChange={() => setRole('employee')}
                />
                <span className={pillSpan}>Employee</span>
              </label>

              {/* Начальник */}
              <label className="cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  className="peer sr-only"
                  checked={role === 'admin'}
                  onChange={() => setRole('admin')}
                />
                <span className={pillSpan}>Admin</span>
              </label>
            </div>
          </div>

          {err && <div className="glass pill px-3 py-2 text-red-300">⚠ {err}</div>}

          <div className="flex items-center">
            <PillButton asLinkTo="/login" variant="ghost" subtle>Sign in</PillButton>
            <div className="ml-auto">
              <PillButton type="submit" variant="primary">
                <UserPlus size={16} className="mr-2 inline" />Create account
              </PillButton>
            </div>
          </div>
        </form>
      </GlassCard>
    </AuthShell>
  )
}
