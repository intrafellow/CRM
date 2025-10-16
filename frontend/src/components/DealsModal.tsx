import { useEffect, useMemo, useState } from 'react'
import LiquidModal from './LiquidModal'
import { KEYS, pickFirst } from '../utils/dataset'
import { useAuth } from '../auth/AuthContext'

export type DealRow = Record<string, unknown> & {
  id?: string; _owner?: string; owner_id?: string; ownerId?: string; owner?: string; ownerID?: string
}
type SelectedMap = Record<string, Set<string>>
type FilterKey = 'responsible' | 'status' | 'sector' | 'type'

const S = (v: unknown) => String(v ?? '').trim()
const genId = () => `deal_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,7)}`

const PREFERRED_ORDER = [
  'Company','Date','Sector','Seniot','Junior team','Source','Source Name',
  'Type','Size, RUB mn','Status','Next connection','Stage','Comment',
  'Responsible','Amount','Sum'
]
const HIDDEN_COLS = ['id','_owner','owner_id','ownerId','owner','ownerID'] as const
const isHidden = (k: string) => (HIDDEN_COLS as readonly string[]).includes(k)

function collectUnique(rows: DealRow[], keys: FilterKey[]) {
  const out: Record<FilterKey, string[]> = { responsible:[], status:[], sector:[], type:[] }
  for (const k of keys) {
    const set = new Set<string>()
    for (const r of rows) {
      const val = S(pickFirst(r, KEYS[k])); if (val) set.add(val)
    }
    out[k] = Array.from(set).sort((a,b)=>a.localeCompare(b))
  }
  return out
}

function Pill({ children, active, onClick }:{
  children: React.ReactNode; active?: boolean; onClick?: ()=>void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`pill rounded-full px-3 py-1 border transition ${
        active ? 'bg-white/20 border-white/50' : 'bg-white/10 border-white/25 hover:bg-white/14'
      }`}
    >
      {children}
    </button>
  )
}

export default function DealsModal({
  open, title, rows, onClose, onUpdate, onDelete, onAdd
}: { 
  open:boolean; 
  title:string; 
  rows:DealRow[]; 
  onClose:()=>void;
  onUpdate?: (id: string, data: DealRow) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onAdd?: (data: DealRow) => Promise<void>;
}) {
  const { user } = useAuth()

  const [baseRows, setBaseRows] = useState<DealRow[]>([])
  useEffect(() => {
    const withIds = rows.map(r => (r.id ? r : { ...r, id: genId() }))
    setBaseRows(withIds)
  }, [rows])

  const FILTER_KEYS: FilterKey[] = ['responsible','status','sector','type']
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<SelectedMap>({})
  const [openKey, setOpenKey] = useState<FilterKey | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Record<string, string>>({})

  const canEdit = (r: DealRow) =>
    user?.role === 'admin' || (!!user?.email && [r._owner, r.owner_id, r.ownerId, r.owner, r.ownerID].includes(user.email))

  const allKeysOrdered = useMemo(() => {
    const set = new Set<string>()
    baseRows.forEach(r => Object.keys(r).forEach(k => { if (!isHidden(k)) set.add(k) }))
    const rest = Array.from(set).filter(k => !PREFERRED_ORDER.includes(k)).sort((a,b)=>a.localeCompare(b))
    return [...PREFERRED_ORDER.filter(k => set.has(k)), ...rest]
  }, [baseRows])

  const startEdit = (r: DealRow) => {
    if (!canEdit(r)) return
    setEditingId(r.id!)
    const d: Record<string, string> = {}
    allKeysOrdered.forEach(k => { d[k] = S((r as any)[k]) })
    setDraft(d)
  }
  const cancelEdit = () => { setEditingId(null); setDraft({}) }

  const applyEdit = async () => {
    if (!editingId) return
    
    const currentRow = baseRows.find(r => r.id === editingId)
    if (!currentRow) return
    
    const updatedRow: DealRow = { ...currentRow }
    Object.keys(draft).forEach(k => { if (!isHidden(k)) (updatedRow as any)[k] = draft[k] })
    
    try {
      // Если это новая запись (нет id в исходных данных) или есть callback для добавления
      const isNewRow = !rows.find(r => r.id === editingId)
      
      if (isNewRow && onAdd) {
        await onAdd(updatedRow)
      } else if (onUpdate) {
        await onUpdate(editingId, updatedRow)
      }
      
      // Обновляем локальное состояние
      setBaseRows(prev => prev.map(r => r.id === editingId ? updatedRow : r))
      setEditingId(null)
      setDraft({})
    } catch (err: any) {
      alert(`Ошибка сохранения: ${err.message}`)
    }
  }

  const removeRow = async (row: DealRow) => {
    if (!canEdit(row)) return
    if (!confirm('Удалить сделку?')) return
    
    const id = row.id
    if (!id) return
    
    try {
      if (onDelete) {
        await onDelete(id)
      }
      setBaseRows(prev => prev.filter(r => r.id !== id))
    } catch (err: any) {
      alert(`Ошибка удаления: ${err.message}`)
    }
  }

  const addRow = () => {
    if (!user?.email) return
    const id = genId()
    const empty: DealRow = { id, ownerId: user.email }
    allKeysOrdered.forEach(k => { (empty as any)[k] = '' })
    setBaseRows(prev => [empty, ...prev])
    setEditingId(id)
    const d: Record<string,string> = {}
    allKeysOrdered.forEach(k => { d[k] = '' })
    setDraft(d)
  }

  const uniques = useMemo(() => collectUnique(baseRows, FILTER_KEYS), [baseRows])

  const toggleVal = (k: FilterKey, v: string) => {
    setSelected(prev => {
      const next: SelectedMap = { ...prev }
      const set = new Set(next[k] ?? [])
      set.has(v) ? set.delete(v) : set.add(v)
      next[k] = set
      return next
    })
  }

  const clearAll = () => { setQ(''); setSelected({}); setOpenKey(null) }

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    const hasQuery = query.length > 0
    const activeKeys = FILTER_KEYS.filter(k => (selected[k]?.size ?? 0) > 0)
    return baseRows.filter(r => {
      for (const k of activeKeys) {
        const picked = S(pickFirst(r, KEYS[k])); if (!selected[k]!.has(picked)) return false
      }
      if (hasQuery) {
        const hay = Object.entries(r)
          .filter(([k]) => !isHidden(k))
          .map(([,v]) => S(v)).join(' • ').toLowerCase()
        if (!hay.includes(query)) return false
      }
      return true
    })
  }, [baseRows, q, selected])

  const cols = allKeysOrdered

  const renderCell = (row: DealRow, col: string) => {
    const isEditing = editingId === row.id
    if (!isEditing) return S((row as any)[col])
    return (
      <input
        className="px-2 py-1 bg-white/10 border border-white/20 rounded-md outline-none w-full"
        value={draft[col] ?? ''}
        onChange={(e)=>setDraft(d => ({ ...d, [col]: e.target.value }))}
        onKeyDown={(e)=>{ if (e.key==='Enter') applyEdit(); if (e.key==='Escape') cancelEdit() }}
      />
    )
  }

  const countSelected = (k: FilterKey) => selected[k]?.size ?? 0

  return (
    <LiquidModal
      open={open}
      title={`${title}${filtered.length ? ` — ${filtered.length}` : ''}`}
      onClose={onClose}
      maxWidth="max-w-6xl"
    >
      <div className="glass rounded-2xl p-3 mb-3 border border-black/10">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Поиск..."
            className="input pill rounded-full px-3 py-2 flex-1 bg-black/5 border border-black/20 outline-none"
          />
          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={clearAll}
              className="pill rounded-full px-3 py-2 bg-black/5 border border-black/20 hover:bg-black/10"
            >Сбросить</button>
            <button
              type="button"
              onClick={addRow}
              title="Добавить сделку"
              className="tile-btn"
            >＋</button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-8 items-center">
          {(['responsible','status','sector','type'] as FilterKey[]).map((k) => (
            <div key={k} className="flex items-center gap-2">
              <Pill active={openKey===k} onClick={()=>setOpenKey(prev=>prev===k?null:k)}>
                <span className="capitalize">{k}</span>
                {countSelected(k)>0 && <span className="ml-2 text-xs opacity-80">({countSelected(k)})</span>}
              </Pill>
            </div>
          ))}
        </div>

        {openKey && (
          <div className="mt-3 glass rounded-2xl p-3 border border-black/10">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm opacity-80 capitalize">Выбор: {openKey}</div>
              <button
                type="button"
                className="pill rounded-full px-3 py-1 bg-black/5 border border-black/20 hover:bg-black/10"
                onClick={()=>setOpenKey(null)}
              >Назад</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(collectUnique(baseRows,[openKey])[openKey] ?? []).map(v => (
                <Pill key={v}
                  active={Boolean(selected[openKey]?.has(v))}
                  onClick={()=>toggleVal(openKey, v)}
                >{v}</Pill>
              ))}
            </div>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="opacity-80">Нет записей</div>
      ) : (
        <div className="w-full overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="px-3 py-2 border-b border-black/10 whitespace-nowrap opacity-80">Действия</th>
                {cols.map(c => (
                  <th key={c} className="px-3 py-2 border-b border-black/10 whitespace-nowrap opacity-80">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const editing = editingId === r.id
                const allowed = canEdit(r)
                return (
                  <tr key={r.id as string} className="hover:bg-black/5">
                    <td className="px-3 py-2 border-b border-black/5 whitespace-nowrap">
                      {!editing ? (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={()=>startEdit(r)}
                            disabled={!allowed}
                            title={allowed ? 'Редактировать' : 'Нет прав'}
                            className="tile-btn"
                          >✎</button>
                          <button
                            onClick={()=>removeRow(r)}
                            disabled={!allowed}
                            title={allowed ? 'Удалить' : 'Нет прав'}
                            className="tile-btn"
                          >✕</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={applyEdit}
                            title="Сохранить (Enter)"
                            className="tile-btn"
                          >✓</button>
                          <button
                            onClick={cancelEdit}
                            title="Отмена (Esc)"
                            className="tile-btn"
                          >✕</button>
                        </div>
                      )}
                    </td>
                    {cols.map(c => (
                      <td key={c} className="px-3 py-2 border-b border-black/5 whitespace-nowrap">
                        {(() => {
                          const isEditing = editingId === r.id
                          if (!isEditing) return S((r as any)[c])
                          return (
                            <input
                              className="px-2 py-1 bg-black/5 border border-black/20 rounded-md outline-none w-full"
                              value={(r.id === editingId ? (S((r as any)[c]) ?? '') : S((r as any)[c])) || draft[c] || ''}
                              onChange={(e)=>setDraft(d => ({ ...d, [c]: e.target.value }))}
                              onKeyDown={(e)=>{ if (e.key==='Enter') applyEdit(); if (e.key==='Escape') cancelEdit() }}
                            />
                          )
                        })()}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </LiquidModal>
  )
}
