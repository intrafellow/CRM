import { useState } from 'react'
import { FILTER_COLUMNS } from '../utils/dataset'

type DealsFilterState = {
  by: 'columns' | 'values'
  col?: 'responsible' | 'status' | 'sector' | 'type'
}

export function DrilldownDealFilters({
  options,
  selected,
  setSelected,
  onReset
}: {
  options: {responsibles: string[]; statuses: string[]; sectors: string[]; types: string[]}
  selected: {responsible: string[]; status: string[]; sector: string[]; type: string[]}
  setSelected: (s: {responsible: string[]; status: string[]; sector: string[]; type: string[]}) => void
  onReset: () => void
}) {
  if (
    !options ||
    (!options.responsibles?.length && !options.statuses?.length && !options.sectors?.length && !options.types?.length)
  ) return null

  const [mode, setMode] = useState<DealsFilterState>({ by: 'columns' })

  function open(col: DealsFilterState['col']) { setMode({ by: 'values', col }) }
  function back() { setMode({ by: 'columns' }) }
  function toggle(col: DealsFilterState['col'], value: string) {
    const key = col!
    const current = new Set(selected[key])
    current.has(value) ? current.delete(value) : current.add(value)
    setSelected({ ...selected, [key]: Array.from(current) })
  }

  return (
    <div className="glass p-4 rounded-2xl flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-sm opacity-80">Фильтры</div>
        <div className="flex gap-2">
          {mode.by === 'values' && (
            <button className="glass px-3 py-1 rounded-xl hover:bg-white/10" onClick={back}>← Назад</button>
          )}
          <button className="glass px-3 py-1 rounded-xl hover:bg-white/10" onClick={onReset}>Сбросить</button>
        </div>
      </div>

      {mode.by === 'columns' ? (
        <div className="flex gap-2 flex-wrap">
          {FILTER_COLUMNS.map(c => {
            const has =
              (c.key === 'responsible' && options.responsibles.length) ||
              (c.key === 'status' && options.statuses.length) ||
              (c.key === 'sector' && options.sectors.length) ||
              (c.key === 'type' && options.types.length)
            if (!has) return null
            return (
              <button key={c.key} onClick={() => open(c.key)}
                className="px-3 py-1 rounded-xl border bg-white/5 hover:bg-white/10 border-white/20">
                {c.label}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="flex gap-2 flex-wrap">
          {(mode.col === 'responsible' ? options.responsibles
            : mode.col === 'status' ? options.statuses
            : mode.col === 'sector' ? options.sectors
            : options.types
          ).map(v => {
            const isActive = selected[mode.col!].includes(v)
            return (
              <button key={v} onClick={() => toggle(mode.col!, v)}
                className={`px-3 py-1 rounded-xl border ${isActive ? 'bg-white/20' : 'bg-white/5 hover:bg-white/10'} border-white/20`}>
                {v || '—'}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function ContactFiltersUI(){ return null }
