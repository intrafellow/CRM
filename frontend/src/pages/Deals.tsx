import { useMemo, useState, useEffect } from 'react';
import SearchBar from '../components/SearchBar';
import DataTable, { ColumnDef } from '../components/DataTable';
import UploadExport from '../components/UploadExport';
import LiquidModal from '../components/LiquidModal';
import DealForm from '../components/DealForm';
import { RequireAuth } from '../auth/guards';
import { useAuth } from '../auth/AuthContext';
import { loadRows, STORE, rowCanEdit, DealRow } from '../utils/dataset';
import { stripInternalKeys } from '../utils/headers';
import { subscribeStore, saveRowsAndNotify, replaceContactsFromDeals } from '../utils/crossSync';

function buildColumns(rows: DealRow[]): ColumnDef<DealRow>[] {
  const first = rows[0] ? stripInternalKeys(rows[0]) : {};
  return Object.keys(first).map((k) => ({
    key: k,
    title: k,
    nowrap: ['Company','Source Name','Next connection','Comments'].includes(k as string),
    className: k === 'Comments' ? 'max-w-[28rem]' : ''
  }));
}

function DealsInner() {
  const { user } = useAuth();
  const [rows, setRows] = useState<DealRow[]>(loadRows<DealRow[]>(STORE.deals, []));
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DealRow | null>(null);
  const [columns, setColumns] = useState<ColumnDef<DealRow>[]>(buildColumns(rows));

  useEffect(() => {
    const off = subscribeStore([STORE.deals, STORE.contacts], () => {
      const next = loadRows<DealRow[]>(STORE.deals, []);
      setRows(next);
      setColumns(buildColumns(next));
    });
    return off;
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(r => Object.values(r).some(v => String(v ?? '').toLowerCase().includes(s)));
  }, [rows, q]);

  function persist(next: DealRow[]) {
    setRows(next);
    setColumns(buildColumns(next));
    saveRowsAndNotify(STORE.deals, next);
  }

  function onImport(newRows: any[]) {
    const base = Date.now();
    const stamped: DealRow[] = (newRows ?? []).map((r: any, i: number) => ({
      id: r?.id ?? `d_${base}_${i}`,
      ownerId: r?.ownerId ?? user?.id,
      ...r,
    }));
    // ПОЛНАЯ ЗАМЕНА сделок + владелец
    persist(stamped);
    // ПОЛНАЯ ЗАМЕНА контактов (извлечённых из сделок) + владелец
    try { replaceContactsFromDeals(stamped as any[], user?.id); } catch {}
  }

  function add() { setEditing(null); setOpen(true); }
  function onEdit(row: DealRow) { setEditing(row); setOpen(true); }
  function onDelete(id: string) { persist(rows.filter(r => r.id !== id)); }
  function onSubmit(row: DealRow) {
    const withOwner: DealRow = { ...row, ownerId: (row as any).ownerId ?? user?.id };
    const exists = rows.some(r => r.id === withOwner.id);
    const next = exists ? rows.map(r => (r.id === withOwner.id ? withOwner : r)) : [...rows, { ...withOwner, id: withOwner.id ?? `d_${Date.now()}` }];
    persist(next); setOpen(false);
  }

  return (
    <div className="p-4 grid gap-4">
      <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
        <SearchBar value={q} onChange={setQ} placeholder="Поиск по сделкам..." />
        <div className="flex gap-2">
          <UploadExport type="deals" rows={rows} onImport={onImport} filename="deals" />
          <button className="glass px-3 py-2 rounded-2xl hover:bg-white/10" onClick={add}>+ Добавить</button>
        </div>
      </div>

      <DataTable<DealRow>
        rows={filtered}
        columns={columns}
        onEdit={onEdit}
        onDelete={onDelete}
        canEditRow={(r)=>rowCanEdit(user, r)}
      />

      <LiquidModal open={open} title={editing ? 'Редактировать сделку' : 'Новая сделка'} onClose={()=>setOpen(false)}>
        <DealForm initial={editing ?? undefined} onSubmit={onSubmit} onCancel={()=>setOpen(false)} />
      </LiquidModal>
    </div>
  );
}

export default function Deals() {
  return <RequireAuth><DealsInner/></RequireAuth>;
}
