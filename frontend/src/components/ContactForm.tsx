import { useState } from 'react'
import type { ContactRow } from '../utils/dataset'

export default function ContactForm({
  initial, onSubmit, onCancel, title
}: {
  initial?: Partial<ContactRow>,
  onSubmit: (row: ContactRow) => void,
  onCancel: () => void,
  title?: string
}) {
  const [contact, setContact] = useState<string>(String(initial?.contact ?? ''))
  function submit() {
    const row: ContactRow = { id: String(initial?.id ?? `c_${Date.now()}`), contact: contact.trim() }
    if (!row.contact) return
    onSubmit(row)
  }
  return (
    <form className="grid gap-3" onSubmit={e => { e.preventDefault(); submit() }}>
      <label className="grid gap-1">
        <span className="text-sm opacity-80">{title ?? 'Contact'}</span>
        <input className="glass px-3 py-2 rounded-xl outline-none" value={contact} onChange={e=>setContact(e.target.value)} placeholder="Enter contact"/>
      </label>
      <div className="flex justify-end gap-2">
        <button type="button" className="glass px-3 py-2 rounded-xl hover:bg-white/10" onClick={onCancel}>Cancel</button>
        <button type="submit" className="glass px-3 py-2 rounded-xl hover:bg-white/10">Save</button>
      </div>
    </form>
  )
}
