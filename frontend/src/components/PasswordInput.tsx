import { useMemo, useState } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'
export default function PasswordInput({ label, placeholder, value, onChange }:{
  label:string; placeholder?:string; value:string; onChange:(v:string)=>void
}) {
  const [show,setShow]=useState(false)
  const score = useMemo(()=> {
    let s=0; if(value.length>=8) s++; if(/[A-Z]/.test(value)) s++; if(/[0-9]/.test(value)) s++; if(/[^A-Za-z0-9]/.test(value)) s++; return s
  },[value])
  const colors=['#ef4444','#f59e0b','#10b981','#22d3ee']
  const width = `${(score/4)*100}%`
  return (
    <label className="grid gap-1">
      <span className="small">{label}</span>
      <div className="flex items-center gap-2 input pill px-3 auth-field">
        <Lock size={18} />
        <input className="bg-transparent outline-none w-full" value={value} onChange={e=>onChange(e.target.value)}
               type={show?'text':'password'} placeholder={placeholder} required />
        <button type="button" className="opacity-80 hover:opacity-100" onClick={()=>setShow(s=>!s)}>
          {show? <EyeOff size={18}/> : <Eye size={18}/> }
        </button>
      </div>
      <div className="strength mt-2"><div style={{ width, background: colors[Math.max(0,score-1)] }}/></div>
    </label>
  )
}
