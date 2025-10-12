import {useMemo, useState} from 'react'
import SearchBar from '../components/SearchBar'
import UploadExport from '../components/UploadExport'
import DataTable from '../components/DataTable'
import LiquidModal from '../components/LiquidModal'
import DealForm from '../components/DealForm'
import { RequireAuth } from '../auth/guards'
import { useAuth } from '../auth/AuthContext'
import { loadRows, saveRows, rowCanEdit, STORE } from '../utils/dataset'
import FilterBar, {FilterState, applyFilters} from '../components/FilterBar'

type DealRow = Record<string, any> & { id: string, ownerId?: string, _owner?: string }

function DealsInner(){
  const { user } = useAuth()
  const [rows, setRows] = useState<DealRow[]>(loadRows<DealRow[]>(STORE.deals, []))
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<DealRow | null>(null)
  const [filters, setFilters] = useState<FilterState>({
    responsible:new Set(), status:new Set(), sector:new Set(), type:new Set()
  })

  const filtered = useMemo(()=>{
    const text = q.trim().toLowerCase()
    const byText = !text ? rows : rows.filter(r =>
      Object.values(r).some(v => String(v ?? '').toLowerCase().includes(text))
    )
    return applyFilters(byText, filters)
  },[rows, q, filters])

  function persist(next: DealRow[]) { setRows(next); saveRows(STORE.deals, next) }
  function onImport(newRows: DealRow[]) { persist(newRows) }
  function add(){ setEditing(null); setOpen(true) }
  function onEdit(row: DealRow){ setEditing(row); setOpen(true) }
  function onDelete(id: string){ persist(rows.filter(r=> r.id !== id)) }
  function onSubmit(row: DealRow){
    const data = {...row}
    if (!data.ownerId && user?.id) data.ownerId = user.id
    if (!data._owner  && user?.email) data._owner = user.email
    const exists = rows.some(r=> r.id === data.id)
    const next = exists ? rows.map(r => r.id === data.id ? data : r) : [...rows, data]
    persist(next); setOpen(false)
  }

  return (
    <div className="p-4 grid gap-4">
      {/* верхняя полоса: поиск + кнопки, фиксированные размеры */}
      <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
        <SearchBar value={q} onChange={setQ} placeholder="Поиск по сделкам..." />
        <div className="flex gap-2 items-center">
          <UploadExport type="deals" rows={rows} onImport={onImport} filename="deals" />
          <button className="glass px-3 py-2 rounded-2xl hover:bg-white/10" onClick={add}>+ Добавить</button>
        </div>
      </div>

      {/* фильтры как раньше: только кнопки категорий, по клику раскрываются значения */}
      <FilterBar rows={rows} value={filters} onChange={setFilters} />

      <DataTable<DealRow>
        rows={filtered}
        columns={[
          { key:'Company',        title:'Company',        width: 220, nowrap: true },
          { key:'Date',           title:'Date',           width: 90,  nowrap: true },
          { key:'Sector',         title:'Sector',         width: 140, nowrap: true },
          { key:'Seniot',         title:'Seniot',         width: 70,  nowrap: true },
          { key:'Junior team',    title:'Junior team',    width: 110, nowrap: true },
          { key:'Source',         title:'Source',         width: 110, nowrap: true },
          { key:'Source Name',    title:'Source Name',    width: 160, nowrap: true },
          { key:'Type',           title:'Type',           width: 110, nowrap: true },
          { key:'Size, RUB mn',   title:'Size, RUB mn',   width: 110, nowrap: true },
          { key:'Status',         title:'Status',         width: 140, nowrap: true },
          { key:'Next connection',title:'Next connection',width: 160, nowrap: true },
          { key:'Comments',       title:'Comments',       width: 380 } // расширили, чтобы не наезжало
        ]}
        onEdit={onEdit}
        onDelete={onDelete}
        canEditRow={(r)=>rowCanEdit(user, r)}
      />

      <LiquidModal open={open} title={editing?'Редактировать сделку':'Новая сделка'} onClose={()=>setOpen(false)}>
        <DealForm initial={editing ?? undefined} onSubmit={onSubmit} onCancel={()=>setOpen(false)} />
      </LiquidModal>
    </div>
  )
}

export default function Deals(){
  return (
    <RequireAuth>
      <DealsInner />
    </RequireAuth>
  )
}
