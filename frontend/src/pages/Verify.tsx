import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Mail, KeyRound } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import AuthShell from '../components/AuthShell'
import GlassCard from '../components/GlassCard'
import AuthInput from '../components/AuthInput'
import PillButton from '../components/PillButton'

function useQP(n:string){ const p=new URLSearchParams(useLocation().search); return p.get(n) }

export default function Verify() {
  const nav = useNavigate()
  const { requestCode, verifyCode } = useAuth()
  const emailParam = useQP('email') || ''
  const [email, setEmail] = useState(emailParam); const [code, setCode] = useState('')
  const [msg, setMsg] = useState<string | null>(null); const [err,setErr]=useState<string|null>(null)

  useEffect(()=>{ setEmail(emailParam) },[emailParam])

  async function send(){ const r=await requestCode(email.trim()); if(r.ok) setMsg(`Код (симуляция): ${r.code}`) }
  async function submit(e:React.FormEvent){ e.preventDefault(); const r=await verifyCode(email.trim(), code.trim()); if(!r.ok){ setErr(r.error||'Ошибка'); return } nav('/') }

  return (
    <AuthShell>
      <GlassCard title="Подтверждение e-mail" subtitle="Введите код из письма (симуляция)">
        <form className="grid gap-4" onSubmit={submit}>
          <AuthInput label="E-mail" placeholder="you@company.com" value={email} onChange={setEmail} left={<Mail size={18}/>}/>
          <AuthInput label="Код" placeholder="6 цифр" value={code} onChange={setCode} left={<KeyRound size={18}/>}/>
          {msg && <div className="glass pill px-3 py-2 text-emerald-300">{msg}</div>}
          {err && <div className="glass pill px-3 py-2 text-red-300">⚠ {err}</div>}
          <div className="flex gap-2">
            <PillButton type="button" variant="ghost" onClick={send}>Выслать код</PillButton>
            <PillButton type="submit">Подтвердить</PillButton>
          </div>
        </form>
      </GlassCard>
    </AuthShell>
  )
}
