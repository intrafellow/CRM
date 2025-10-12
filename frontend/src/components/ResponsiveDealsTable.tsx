import React from 'react'
export type DealRow = Record<string, unknown> & { id?: string }
const S = (v: unknown) => String(v ?? '').trim()

export default function ResponsiveDealsTable({
  rows, columns, onEdit, onDelete, canEdit
}: {
  rows: DealRow[]
  columns: string[]
  onEdit: (r: DealRow)=>void
  onDelete: (r: DealRow)=>void
  canEdit: (r: DealRow)=>boolean
}) {
  return (
    <div className="w-full">
      <div className="overflow-x-auto rounded-2xl">
        <table className="w-full table-fixed text-[11px] md:text-[12px] leading-4">
          <colgroup>
            {/* узкая колонка действий */}
            <col style={{width:'64px'}} />
            {columns.map((_, i) => <col key={i} />)}
          </colgroup>
          <thead>
            <tr className="text-left">
              {/* пустой th вместо "Действия" */}
              <th className="px-1 py-1 border-b border-white/10 whitespace-nowrap"></th>
              {columns.map(c => (
                <th key={c} className="px-2 py-2 border-b border-white/10 whitespace-nowrap">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const allowed = canEdit(r)
              return (
                <tr key={r.id as string} className="hover:bg-white/5">
                  <td className="px-1 py-1 border-b border-white/5 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <button
                        className="tile-btn w-8 h-8 p-0 flex items-center justify-center"
                        title={allowed?'Изменить':'Нет прав'}
                        onClick={()=>allowed && onEdit(r)}
                        disabled={!allowed}
                      >✎</button>
                      <button
                        className="tile-btn w-8 h-8 p-0 flex items-center justify-center"
                        title={allowed?'Удалить':'Нет прав'}
                        onClick={()=>allowed && onDelete(r)}
                        disabled={!allowed}
                      >✕</button>
                    </div>
                  </td>
                  {columns.map(c => {
                    const val = S((r as any)[c])
                    return (
                      <td key={c}
                          className="px-2 py-1.5 border-b border-white/5 align-top whitespace-normal break-words">
                        <span className="block truncate" title={val}>{val}</span>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
