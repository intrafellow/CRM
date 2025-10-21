import { useEffect, useMemo, useState } from 'react'
import LiquidModal from './LiquidModal'

type Row = Record<string, any> & { id?: string }

export default function SheetModal({
  open,
  title,
  columns,
  rows,
  onClose,
  onAdd,
  onUpdate,
  onDelete,
}: {
  open: boolean
  title: string
  columns: string[]
  rows: Row[]
  onClose: () => void
  onAdd: (data: Row) => Promise<void>
  onUpdate: (id: string, data: Row) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [baseRows, setBaseRows] = useState<Row[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Record<string, string>>({})

  useEffect(() => {
    setBaseRows(rows)
    setEditingId(null)
    setDraft({})
  }, [rows])

  const startEdit = (r: Row) => {
    setEditingId(String(r.id))
    const d: Record<string,string> = {}
    columns.forEach(k => { d[k] = String(r[k] ?? '') })
    setDraft(d)
  }
  const cancel = () => { setEditingId(null); setDraft({}) }
  const change = (k: string, v: string) => setDraft(prev => ({ ...prev, [k]: v }))

  const add = async () => {
    const empty: Row = {}
    columns.forEach(k => { empty[k] = '' })
    await onAdd(empty)
  }

  const save = async () => {
    if (!editingId) return
    const data: Row = {}
    columns.forEach(k => { (data as any)[k] = draft[k] ?? '' })
    await onUpdate(editingId, data)
    setEditingId(null)
    setDraft({})
  }

  const remove = async (id?: string) => {
    if (!id) return
    await onDelete(id)
  }

  const cols = useMemo(() => columns, [columns])

  return (
    <LiquidModal open={open} title={title} onClose={onClose} maxWidth="max-w-6xl">
      <div className="flex items-center gap-2 mb-3">
        <button className="tile-btn" title="Add" onClick={add}>＋</button>
        <div className="ml-auto text-sm opacity-70">Total: {baseRows.length}</div>
      </div>
      <div className="w-full overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="px-3 py-2 border-b border-black/10 whitespace-nowrap">Actions</th>
              {cols.map(c => (
                <th key={c} className="px-3 py-2 border-b border-black/10 whitespace-nowrap">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {baseRows.map(r => {
              const isEditing = editingId === r.id
              return (
                <tr key={String(r.id)} className="hover:bg-black/5">
                  <td className="px-3 py-2 border-b border-black/5 whitespace-nowrap">
                    {!isEditing ? (
                      <div className="flex items-center gap-3">
                        <button className="tile-btn" title="Edit" onClick={()=>startEdit(r)}>✎</button>
                        <button className="tile-btn" title="Delete" onClick={()=>remove(r.id)}>✕</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <button className="tile-btn" title="Save" onClick={save}>✓</button>
                        <button className="tile-btn" title="Cancel" onClick={cancel}>✕</button>
                      </div>
                    )}
                  </td>
                  {cols.map(c => (
                    <td key={c} className="px-3 py-2 border-b border-black/5 whitespace-nowrap">
                      {!isEditing ? (
                        String(r[c] ?? '')
                      ) : (
                        c.toLowerCase()==='comments' ? (
                          <textarea className="px-2 py-1 bg-black/5 border border-black/20 rounded-md outline-none w-full" value={draft[c] ?? ''} onChange={(e)=>change(c, e.target.value)} />
                        ) : (
                          <input className="px-2 py-1 bg-black/5 border border-black/20 rounded-md outline-none w-full" value={draft[c] ?? ''} onChange={(e)=>change(c, e.target.value)} />
                        )
                      )}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </LiquidModal>
  )
}








