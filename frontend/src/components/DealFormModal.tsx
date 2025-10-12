import React, { useEffect, useMemo, useState } from 'react'
import LiquidCard from './LiquidCard'

export type DealRow = Record<string, unknown> & { id?: string }
const S = (v: unknown) => String(v ?? '').trim()
const HIDDEN = new Set(['id','_owner','owner','owner_id','ownerId','ownerID'])
const DEFAULT_FIELDS = [
  'Company','Date','Sector','Seniot','Junior team','Source','Source Name',
  'Type','Size, RUB mn','Status','Next connection','Comments','Responsible'
]

export default function DealFormModal({
  open, title, columns, initial, onClose, onSave,
}:{
  open: boolean
  title: string
  columns: string[]
  initial: DealRow
  onClose: ()=>void
  onSave: (draft: DealRow)=>void
}) {
  const visibleCols = useMemo(() => {
    const base = columns.length ? columns : DEFAULT_FIELDS
    return base.filter(c => !HIDDEN.has(c))
  }, [columns])

  const [draft, setDraft] = useState<DealRow>({})
  useEffect(()=>{ setDraft(initial) },[initial, open])
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}/>
      <div className="relative w-[min(1000px,calc(100vw-32px))] max-h-[90vh] overflow-auto">
        <LiquidCard>
          <div className="flex items-start gap-3">
            <div className="text-lg font-medium">{title}</div>
            <button className="ml-auto pill rounded-full px-4 py-2 bg-white/10 border border-white/20 hover:bg-white/14" onClick={onClose}>Закрыть</button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {visibleCols.map((key) => (
              <label key={key} className="grid gap-1">
                <span className="text-xs opacity-80">{key}</span>
                <input
                  className="pill rounded-2xl px-3 py-2 bg-white/10 border border-white/20 outline-none"
                  value={S((draft as any)[key])}
                  onChange={(e)=> setDraft(prev => ({...prev, [key]: e.target.value}))}
                  placeholder={key}
                />
              </label>
            ))}
          </div>

          <div className="mt-4 flex items-center">
            <button
              className="pill rounded-full px-4 py-2 bg-white/10 border border-white/25 hover:bg-white/14"
              onClick={onClose}
            >Отмена</button>
            <button
              className="ml-auto pill rounded-full px-5 py-2 border border-white/30 bg-white/20 hover:bg-white/30"
              onClick={()=> onSave(draft)}
            >Сохранить</button>
          </div>
        </LiquidCard>
      </div>
    </div>
  )
}
