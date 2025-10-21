import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'

export type DealRow = Record<string, any> & { id?: string; ownerId?: string; _owner?: string }

const FALLBACK_FIELDS = [
  'Company','Date','Sector','Seniot','Junior team','Source','Source Name','Type','Size, RUB mn','Status','Next connection','Comments'
] as const

export default function DealForm({
  initial,
  onSubmit,
  onCancel,
  fields,
}: {
  initial?: DealRow
  onSubmit: (row: DealRow) => void
  onCancel: () => void
  fields?: string[]
}) {
  const { user } = useAuth()

  // Безопасная инициализация: никакого .forEach у undefined
  const fieldKeys: string[] = (fields && fields.length>0 ? fields : Array.from(new Set([...(Object.keys(initial ?? {})), ...FALLBACK_FIELDS]))).filter(k => !['id','ownerId','_owner'].includes(String(k)))
  const [form, setForm] = useState<Record<string, string>>(() => {
    const obj: Record<string, string> = {}
    fieldKeys.forEach(key => { obj[key] = String(initial?.[key] ?? '') })
    return obj
  })

  function change(key: string, val: string) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const id = initial?.id ?? `d_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const payload: DealRow = {
      id,
      ...initial,
      ...form,
      // автозаполнение владельца (скрытые служебные поля)
      ownerId: initial?.ownerId ?? user?.id,
      _owner:  initial?._owner  ?? user?.email,
    }
    onSubmit(payload)
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fieldKeys.map(key => (
          <div key={key} className={key === 'Comments' ? 'md:col-span-2' : ''}>
            <div className="text-sm opacity-80 mb-1">{key}</div>
            {key === 'Comments' ? (
              <textarea
                className="w-full glass px-3 py-2 rounded-2xl outline-none min-h-[96px]"
                value={form[key]}
                onChange={e => change(key, e.target.value)}
              />
            ) : (
              <input
                className="w-full glass px-3 py-2 rounded-2xl outline-none"
                value={form[key]}
                onChange={e => change(key, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="glass px-4 py-2 rounded-2xl hover:bg-white/10">Cancel</button>
        <button type="submit" className="glass px-4 py-2 rounded-2xl hover:bg-white/10">Save</button>
      </div>
    </form>
  )
}
