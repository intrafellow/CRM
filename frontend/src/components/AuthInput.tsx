import { ReactNode } from 'react'
export default function AuthInput({
  label, placeholder, type='text', value, onChange, left
}: { label: string; placeholder?: string; type?: string; value: string; onChange:(v:string)=>void; left?:ReactNode }) {
  return (
    <label className="grid gap-1">
      <span className="small">{label}</span>
      <div className="flex items-center gap-2 input pill px-3 auth-field">
        {left}
        <input
          className="bg-transparent outline-none w-full"
          value={value} onChange={e=>onChange(e.target.value)}
          type={type} placeholder={placeholder} required
        />
      </div>
    </label>
  )
}
