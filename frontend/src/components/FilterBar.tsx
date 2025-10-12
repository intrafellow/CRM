import {useMemo, useState} from 'react'
import LiquidCard from './LiquidCard'
import { pickFirst, KEYS } from '../utils/dataset'

export type FilterState = {
  responsible: Set<string>
  status: Set<string>
  sector: Set<string>
  type: Set<string>
}

type Row = Record<string, unknown>

const CATS = [
  {key:'responsible', label:'Responsible', getter:(r:Row)=> String(pickFirst(r, KEYS?.responsible ?? ['Responsible','Seniot','Senior','Responsible']) ?? '')},
  {key:'status',      label:'Status',      getter:(r:Row)=> String(pickFirst(r, KEYS?.status      ?? ['Status']) ?? '')},
  {key:'sector',      label:'Sector',      getter:(r:Row)=> String(pickFirst(r, KEYS?.sector      ?? ['Sector']) ?? '')},
  {key:'type',        label:'Type',        getter:(r:Row)=> String(pickFirst(r, KEYS?.type        ?? ['Type'])   ?? '')},
] as const

function uniq(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a,b)=>a.localeCompare(b))
}

export default function FilterBar({
  rows,
  value,
  onChange
}:{
  rows: Row[]
  value: FilterState
  onChange: (next: FilterState)=>void
}) {
  const [openKey, setOpenKey] = useState<string | null>(null)

  const options = useMemo(()=>{
    const map: Record<string,string[]> = {}
    for (const c of CATS) {
      map[c.key] = uniq(rows.map(c.getter))
    }
    return map
  },[rows])

  function toggle(cat: typeof CATS[number]['key'], v: string){
    const next: FilterState = {
      responsible: new Set(value.responsible),
      status:      new Set(value.status),
      sector:      new Set(value.sector),
      type:        new Set(value.type),
    }
    const set = next[cat]
    if (set.has(v)) set.delete(v); else set.add(v)
    onChange(next)
  }

  function reset(){
    onChange({
      responsible: new Set(),
      status: new Set(),
      sector: new Set(),
      type: new Set(),
    })
    setOpenKey(null)
  }

  return (
    <div className="grid gap-3">
      {/* ряд с кнопками категорий */}
      <div className="glass rounded-2xl px-3 py-2 inline-flex gap-2 items-center w-max">
        {CATS.map(c=>(
          <button
            key={c.key}
            className="px-3 py-2 rounded-2xl glass hover:bg-white/10"
            onClick={()=> setOpenKey(openKey===c.key?null:c.key)}
          >
            {c.label}
          </button>
        ))}
        <button className="ml-2 px-3 py-2 rounded-2xl glass hover:bg-white/10" onClick={reset}>Сбросить</button>
      </div>

      {/* раскрывающийся блок значений (единый, под выбранной категорией) */}
      {openKey && (
        <LiquidCard>
          <div className="text-sm opacity-80 mb-2">Фильтры: {CATS.find(c=>c.key===openKey)?.label}</div>
          <div className="flex flex-wrap gap-8">
            {options[openKey].length === 0 ? (
              <div className="opacity-70">Нет значений</div>
            ) : (
              options[openKey].map(v=>{
                const active = value[openKey as keyof FilterState].has(v)
                return (
                  <button
                    key={v||'-'}
                    className={`px-3 py-2 rounded-2xl ${active?'bg-white/20 glass':'glass hover:bg-white/10'}`}
                    onClick={()=>toggle(openKey as any, v)}
                  >
                    {v || '—'}
                  </button>
                )
              })
            )}
          </div>
        </LiquidCard>
      )}
    </div>
  )
}

export function applyFilters(rows: Row[], f: FilterState){
  const hasAny =
    f.responsible.size || f.status.size || f.sector.size || f.type.size

  if (!hasAny) return rows
  const get = {
    responsible:(r:Row)=> String(pickFirst(r, KEYS?.responsible ?? ['Responsible','Seniot','Senior','Responsible']) ?? ''),
    status:(r:Row)=> String(pickFirst(r, KEYS?.status ?? ['Status']) ?? ''),
    sector:(r:Row)=> String(pickFirst(r, KEYS?.sector ?? ['Sector']) ?? ''),
    type:(r:Row)=> String(pickFirst(r, KEYS?.type ?? ['Type']) ?? ''),
  }
  return rows.filter(r=>{
    if (f.responsible.size && !f.responsible.has(get.responsible(r))) return false
    if (f.status.size      && !f.status.has(get.status(r)))           return false
    if (f.sector.size      && !f.sector.has(get.sector(r)))           return false
    if (f.type.size        && !f.type.has(get.type(r)))               return false
    return true
  })
}
