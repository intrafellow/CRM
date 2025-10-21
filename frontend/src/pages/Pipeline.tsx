import { useEffect, useMemo, useRef, useState } from 'react'
import { getPipeline, createPipelineItem, updatePipelineItem, deletePipelineItem } from '../api/pipeline'
import DataTable from '../components/DataTable'
import LiquidCard from '../components/LiquidCard'
import FullBleed from '../components/FullBleed'
import AutoScale from '../components/AutoScale'
import DealFormModal from '../components/DealFormModal'
import SearchBar from '../components/SearchBar'

const REQUIRED_HEADERS = ['Company','Date','Sector','Seniot','Junior team','Source','Source Name','Type','Size, RUB mn','Status','Next connection','Comments'] as const

export default function Pipeline() {
  const [rows, setRows] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc')
  const menuRef = useRef<HTMLDivElement|null>(null)
  const [menu, setMenu] = useState<{key:string, x:number, y:number}|null>(null)
  const [filters, setFilters] = useState<Record<string, Set<string>>>({})
  const [editingId, setEditingId] = useState<string|null>(null)
  const [draft, setDraft] = useState<Record<string, any>|null>(null)
  const [open, setOpen] = useState(false)
  const [modalInitial, setModalInitial] = useState<Record<string, any>>({})
  const [q, setQ] = useState('')

  async function load(){
    const data = await getPipeline()
    setRows(data.map(d=>{ const row:any = { id: d.id, owner_id: d.owner_id, ...d.data }; delete row['__parsed_extra']; return row }))
  }

  useEffect(()=>{
    load()
    const onImported = ()=> load()
    window.addEventListener('crm:imported', onImported as any)
    return ()=> window.removeEventListener('crm:imported', onImported as any)
  }, [])

  const columns = useMemo(()=> {
    const keys = REQUIRED_HEADERS
    return Array.from(keys).map(k=>({ key: k, title: k, nowrap: true }))
  }, [])

  const searched = useMemo(()=>{
    const query = q.trim().toLowerCase()
    if (!query) return rows
    const cols = REQUIRED_HEADERS as readonly string[]
    return rows.filter(r => cols.some(col => String((r as any)[col] ?? '').toLowerCase().includes(query)))
  }, [rows, q])

  const filtered = useMemo(()=>{
    const activeCols = Object.keys(filters).filter(k => (filters[k]?.size ?? 0) > 0)
    if (activeCols.length === 0) return searched
    return searched.filter(r => activeCols.every(col => {
      const val = String(r[col] ?? '').trim()
      const set = filters[col]!
      return set.has(val)
    }))
  }, [searched, filters])

  const sorted = useMemo(()=>{
    const src = filtered
    if (!sortKey) return src
    const copy = [...src]
    copy.sort((a,b)=>{
      const av = String(a[sortKey] ?? '')
      const bv = String(b[sortKey] ?? '')
      return sortDir==='asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
    return copy
  }, [filtered, sortKey, sortDir])

  function onHeaderClick(key: string){
    setSortKey(key)
    setSortDir(d=> d==='asc' ? 'desc' : 'asc')
  }

  function onHeaderMenu(key: string, rect: DOMRect){ setMenu({ key, x: rect.left, y: rect.bottom + 4 }) }

  function toggleFilter(col: string, val: string){
    setFilters(prev => {
      const next: Record<string, Set<string>> = { ...prev }
      const set = new Set(next[col] ?? [])
      set.has(val) ? set.delete(val) : set.add(val)
      next[col] = set
      return next
    })
  }
  function resetColumnFilters(col: string){
    setFilters(prev => { const n = { ...prev }; delete n[col]; return n })
  }
  function resetAllFilters(){ setFilters({}); setSortKey(null); setMenu(null) }

  async function onEdit(row: any){
    setEditingId(String(row.id))
    const d:any = {}
    for (const k of REQUIRED_HEADERS) d[k] = row[k] ?? ''
    setDraft(d)
  }
  async function onDelete(id: string){ await deletePipelineItem(id); await load() }
  function onChangeDraft(key: string, value: string){ setDraft(prev=> ({ ...(prev||{}), [key]: value })) }
  async function onSaveEdit(){ if(!editingId||!draft) return; await updatePipelineItem(String(editingId), { data: draft }); setEditingId(null); setDraft(null); await load() }
  function onCancelEdit(){ setEditingId(null); setDraft(null) }

  return (
    <>
      {error && (
        <div className="glass rounded-2xl p-3 border border-black/20 bg-red-600/80 text-white font-semibold shadow-lg mb-3">{error}</div>
      )}
      <FullBleed>
        <AutoScale lock={!!editingId} deps={[sorted.length, columns.length]} onScale={(k)=>{ try { document.documentElement.style.setProperty('--ui-scale', String(k)); } catch {} }}>
          <LiquidCard title="Pipeline" actions={
            <div className="flex gap-2 items-center">
              <SearchBar value={q} onChange={setQ} placeholder="Search" />
              <button className="glass px-3 py-1.5 rounded-xl" onClick={resetAllFilters}>Reset filters</button>
              <button className="glass px-3 py-1.5 rounded-xl" onClick={()=> { const d:any={}; REQUIRED_HEADERS.forEach(k=>d[k]=''); setModalInitial(d); setOpen(true) }}>Add</button>
            </div>
          }>
            <DataTable
              rows={sorted}
              columns={columns as any}
              onEdit={onEdit}
              onDelete={onDelete}
              onHeaderClick={onHeaderClick}
              onHeaderMenu={onHeaderMenu}
              rightAlign={false}
              editingId={editingId}
              editDraft={draft}
              onChangeDraft={onChangeDraft}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
            />
          </LiquidCard>
        </AutoScale>
      </FullBleed>
      <DealFormModal
        open={open}
        title="Add row"
        columns={Array.from(REQUIRED_HEADERS)}
        initial={modalInitial}
        onClose={()=> setOpen(false)}
        onSave={async (draft)=>{ await createPipelineItem({ data: draft as any }); setOpen(false); await load() }}
      />
      {menu && (
        <div
          ref={menuRef}
          className="fixed z-40 glass rounded-xl p-2 border border-black/10 text-sm max-h-[50vh] overflow-auto"
          style={{ left: menu.x, top: menu.y, transform:'scale(var(--ui-scale,1))', transformOrigin:'top left' }}
          onMouseLeave={()=> setMenu(null)}
        >
          <div className="mb-1 px-2 py-1 opacity-80">{menu.key}</div>
          <button className="block w-full text-left px-3 py-1 rounded hover:bg-black/10" onClick={()=>{ setSortKey(menu.key); setSortDir('asc'); setMenu(null) }}>Sort A→Z</button>
          <button className="block w-full text-left px-3 py-1 rounded hover:bg-black/10" onClick={()=>{ setSortKey(menu.key); setSortDir('desc'); setMenu(null) }}>Sort Z→A</button>
          <div className="my-1 h-px bg-black/10" />
          {Array.from(new Set(rows.map(r => String((r as any)[menu.key] ?? '').trim()).filter(Boolean))).sort((a,b)=>a.localeCompare(b)).map(val => {
            const active = !!filters[menu.key]?.has(val)
            return (
              <button key={val} className={`block w-full text-left px-3 py-1 rounded ${active?'bg-black/10':''}`} onClick={()=> toggleFilter(menu.key, val)}>
                {active ? '✓ ' : ''}{val || '(empty)'}
              </button>
            )
          })}
          <div className="my-1 h-px bg-black/10" />
          <button className="block w-full text-left px-3 py-1 rounded hover:bg-black/10" onClick={()=>{ resetColumnFilters(menu.key); setMenu(null) }}>Reset filters</button>
        </div>
      )}
    </>
  )
}


