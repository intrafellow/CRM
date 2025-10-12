import { useState } from 'react'
import LiquidCard from './GlassCard' // не обязателен, но чтобы сохранить стеклянный вид внутри модалки
import { useAuth } from '../auth/AuthContext'

export type DealRow = Record<string, any> & { id?: string; ownerId?: string; _owner?: string }

const FIELDS: Array<{key: string; label: string; type?: 'text' | 'textarea'}> = [
  { key: 'Company',           label: 'Company' },
  { key: 'Date',              label: 'Date' },
  { key: 'Sector',            label: 'Sector' },
  { key: 'Seniot',            label: 'Seniot' },
  { key: 'Junior team',       label: 'Junior team' },
  { key: 'Source',            label: 'Source' },
  { key: 'Source Name',       label: 'Source Name' },
  { key: 'Type',              label: 'Type' },
  { key: 'Size, RUB mn',      label: 'Size, RUB mn' },
  { key: 'Status',            label: 'Status' },
  { key: 'Next connection',   label: 'Next connection' },
  { key: 'Comments',          label: 'Comments', type: 'textarea' },
]

export default function DealForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: DealRow
  onSubmit: (row: DealRow) => void
  onCancel: () => void
}) {
  const { user } = useAuth()

  // Безопасная инициализация: никакого .forEach у undefined
  const [form, setForm] = useState<Record<string, string>>(() => {
    const obj: Record<string, string> = {}
    FIELDS.forEach(f => { obj[f.key] = String(initial?.[f.key] ?? '') })
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
        {FIELDS.map(f => (
          <div key={f.key} className={f.type === 'textarea' ? 'md:col-span-2' : ''}>
            <div className="text-sm opacity-80 mb-1">{f.label}</div>
            {f.type === 'textarea' ? (
              <textarea
                className="w-full glass px-3 py-2 rounded-2xl outline-none min-h-[96px]"
                value={form[f.key]}
                onChange={e => change(f.key, e.target.value)}
              />
            ) : (
              <input
                className="w-full glass px-3 py-2 rounded-2xl outline-none"
                value={form[f.key]}
                onChange={e => change(f.key, e.target.value)}
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="glass px-4 py-2 rounded-2xl hover:bg-white/10">
          Отмена
        </button>
        <button type="submit" className="glass px-4 py-2 rounded-2xl hover:bg-white/10">
          Сохранить
        </button>
      </div>
    </form>
  )
}
