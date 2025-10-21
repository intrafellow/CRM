import React from 'react';

export type ColumnDef<T> = {
  key: keyof T | string;
  title?: string;
  width?: string | number;
  nowrap?: boolean;
  className?: string;
};

type Props<T> = {
  rows: T[];
  columns?: ColumnDef<T>[];
  onEdit?: (row: T)=>void;
  onDelete?: (id: string)=>void;
  canEditRow?: (row: T)=>boolean;
  idKey?: keyof T | 'id';
  onHeaderClick?: (key: string)=>void;
  onHeaderMenu?: (key: string, rect: DOMRect)=>void;
  rightAlign?: boolean;
  editingId?: string | null;
  editDraft?: Record<string, any> | null;
  onChangeDraft?: (key: string, value: string)=>void;
  onSaveEdit?: ()=>void;
  onCancelEdit?: ()=>void;
  fullWidth?: boolean;
};

function cls(...a: (string|false|undefined)[]) { return a.filter(Boolean).join(' '); }

export default function DataTable<T extends Record<string, any>>({
  rows, columns, onEdit, onDelete, canEditRow, idKey='id', onHeaderClick, onHeaderMenu, rightAlign=false,
  editingId, editDraft, onChangeDraft, onSaveEdit, onCancelEdit, fullWidth=false
}: Props<T>) {

  const [activeKey, setActiveKey] = React.useState<string | null>(null);
  const initialEdit = React.useRef<{ rowId: string; key: string; initial: string } | null>(null);
  const editingCellRef = React.useRef<HTMLTableCellElement | null>(null);

  // Глобальный Esc: выход из редактирования без необходимости фокуса в инпуте
  React.useEffect(() => {
    if (!editingId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancelEdit && onCancelEdit();
        setActiveKey(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editingId, onCancelEdit]);

  // Клик вне активной ячейки: если изменений не было — отменяем редактирование
  React.useEffect(() => {
    if (!editingId || !activeKey) return;
    const onDown = (e: MouseEvent) => {
      if (!editingCellRef.current) return;
      if (editingCellRef.current.contains(e.target as Node)) return;
      const info = initialEdit.current;
      if (!info) return;
      const current = String(editDraft?.[info.key] ?? '');
      if (current === info.initial) {
        onCancelEdit && onCancelEdit();
        setActiveKey(null);
        initialEdit.current = null;
      }
    };
    document.addEventListener('mousedown', onDown, true);
    return () => document.removeEventListener('mousedown', onDown, true);
  }, [editingId, activeKey, editDraft, onCancelEdit]);

  const first = rows[0] ?? {};
  const cols: ColumnDef<T>[] = (columns && columns.length>0)
    ? columns
    : Object.keys(first).filter(k => k !== '__parsed_extra').map((k)=>({ key: k, title: String(k) }));

  return (
    <div className="overflow-x-auto rounded-2xl border border-black/10">
      <table className={fullWidth?"min-w-full table-fixed":"table-auto"} style={fullWidth?undefined:{ width: 'max-content' }}>
        <colgroup>
          <col style={{ width: '60px' }} />
          {cols.map((c)=>(
            <col key={String(c.key)} style={c.width ? {width: c.width} : {}} />
          ))}
        </colgroup>
        <thead className="text-left text-slate-700">
          <tr>
            <th className="px-3 py-2 font-semibold"> </th>
            {cols.map((c)=>(
              <th
                key={String(c.key)}
                className={cls(
                  "px-3 py-2 font-semibold",
                  c?.nowrap ? "whitespace-nowrap" : "whitespace-normal break-words",
                  c?.className,
                  onHeaderClick && 'cursor-pointer hover:underline'
                )}
                onClick={()=> onHeaderClick && onHeaderClick(String(c.key))}
              >
                <span>{c.title ?? String(c.key)}</span>
                {onHeaderMenu && (
                  <button
                    type="button"
                    className="ml-2 text-xs opacity-80 hover:opacity-100"
                    onClick={(e)=>{ e.stopPropagation(); const rect = (e.currentTarget as HTMLElement).getBoundingClientRect(); onHeaderMenu(String(c.key), rect); }}
                    title="Filter & sort"
                  >▾</button>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-slate-900/90">
          {rows.map((r, idx)=> {
            const id = (r[idKey] ?? r['id'] ?? String(idx)) as string;
            const can = canEditRow ? !!canEditRow(r) : true;
            return (
              <tr
                key={id}
                className="border-t border-black/10 hover:bg-black/5"
              >
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    {/* Управление без явных Save/Cancel — Enter/blur сохранит, Esc отменит */}
                    {onDelete && (!editingId || editingId !== id) && (
                      <button
                        title={can ? "Delete" : "No rights"}
                        className={cls("px-2 py-1 rounded-lg bg-black/5", !can && "opacity-50 cursor-not-allowed")}
                        onClick={()=> can && onDelete(id)}
                        disabled={!can}
                      >✕</button>
                    )}
                  </div>
                </td>
                {cols.map((c)=>{
                  const k = String(c.key)
                  const isEditingCell = editingId === id && !!onChangeDraft && activeKey === k
                  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement|HTMLTextAreaElement>) => {
                    if (e.key === 'Enter') { e.preventDefault(); onSaveEdit && onSaveEdit(); setActiveKey(null); }
                    if (e.key === 'Escape') { e.preventDefault(); onCancelEdit && onCancelEdit(); setActiveKey(null); }
                  }
                  return (
                  <td
                    key={k}
                    className={cls(
                    "px-3 py-2 align-top",
                    rightAlign ? "text-right" : "text-left",
                    k.toLowerCase()==='comments' ? "whitespace-pre-wrap break-words" : (c?.nowrap ? "whitespace-nowrap" : "whitespace-normal break-words"),
                    c?.className
                  )}
                    ref={isEditingCell ? editingCellRef : undefined}
                    onDoubleClick={()=>{
                      if (!onChangeDraft) return;
                      if (editingId !== id) {
                        if (onEdit && can) { onEdit(r); setActiveKey(k); }
                      } else {
                        setActiveKey(k);
                      }
                      const initialValue = String(r[c.key as keyof T] ?? '');
                      initialEdit.current = { rowId: id, key: k, initial: initialValue };
                    }}
                  >
                    {isEditingCell ? (
                      k.toLowerCase()==='comments' ? (
                        <textarea className="w-full glass px-2 py-1 rounded-xl font-mono" style={{maxWidth: '50ch', width: '50ch'}} value={String(editDraft?.[k] ?? '')} onChange={(e)=> onChangeDraft(k, e.target.value)} onKeyDown={handleKeyDown} onBlur={()=>{ onSaveEdit && onSaveEdit(); setActiveKey(null); }} />
                      ) : (
                        <input className="w-full glass px-2 py-1 rounded-xl" value={String(editDraft?.[k] ?? '')} onChange={(e)=> onChangeDraft(k, e.target.value)} onKeyDown={handleKeyDown} onBlur={()=>{ onSaveEdit && onSaveEdit(); setActiveKey(null); }} />
                      )
                    ) : (
                      k.toLowerCase()==='comments' ? (
                        <div className="whitespace-pre-wrap break-words" style={{maxWidth: '50ch', wordBreak: 'break-word'}}>
                          {String(r[c.key as keyof T] ?? '')}
                        </div>
                      ) : (
                        String(r[c.key as keyof T] ?? '')
                      )
                    )}
                  </td>
                  )
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
