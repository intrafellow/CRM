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
};

function cls(...a: (string|false|undefined)[]) { return a.filter(Boolean).join(' '); }

export default function DataTable<T extends Record<string, any>>({
  rows, columns, onEdit, onDelete, canEditRow, idKey='id'
}: Props<T>) {

  const first = rows[0] ?? {};
  const cols: ColumnDef<T>[] = (columns && columns.length>0)
    ? columns
    : Object.keys(first).map((k)=>({ key: k, title: String(k) }));

  return (
    <div className="overflow-auto rounded-2xl border border-white/10">
      <table className="min-w-full table-fixed">
        <colgroup>
          <col style={{ width: '60px' }} />
          {cols.map((c)=>(
            <col key={String(c.key)} style={c.width ? {width: c.width} : {}} />
          ))}
        </colgroup>
        <thead className="text-left text-slate-200/80">
          <tr>
            <th className="px-3 py-2 font-semibold"> </th>
            {cols.map((c)=>(
              <th key={String(c.key)} className={cls(
                "px-3 py-2 font-semibold",
                c?.nowrap ? "whitespace-nowrap" : "whitespace-normal break-words",
                c?.className
              )}>
                {c.title ?? String(c.key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-slate-100/90">
          {rows.map((r, idx)=> {
            const id = (r[idKey] ?? r['id'] ?? String(idx)) as string;
            const can = canEditRow ? !!canEditRow(r) : true;
            return (
              <tr key={id} className="border-t border-white/10 hover:bg-white/5">
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    {onEdit && (
                      <button
                        title={can ? "Редактировать" : "Нет прав"}
                        className={cls("px-2 py-1 rounded-lg bg-white/5", !can && "opacity-50 cursor-not-allowed")}
                        onClick={()=> can && onEdit(r)}
                        disabled={!can}
                      >✎</button>
                    )}
                    {onDelete && (
                      <button
                        title={can ? "Удалить" : "Нет прав"}
                        className={cls("px-2 py-1 rounded-lg bg-white/5", !can && "opacity-50 cursor-not-allowed")}
                        onClick={()=> can && onDelete(id)}
                        disabled={!can}
                      >✕</button>
                    )}
                  </div>
                </td>
                {cols.map((c)=>(
                  <td key={String(c.key)} className={cls(
                    "px-3 py-2 align-top",
                    c?.nowrap ? "whitespace-nowrap" : "whitespace-normal break-words",
                    c?.className
                  )}>
                    {String(r[c.key as keyof T] ?? '')}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
