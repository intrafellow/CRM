import { useEffect, useMemo, useState } from 'react';
import SearchBar from '../components/SearchBar';
import DataTable from '../components/DataTable';
import UploadExport from '../components/UploadExport';
import LiquidCard from '../components/LiquidCard';
import LiquidModal from '../components/LiquidModal';
import ContactForm from '../components/ContactForm';
import { RequireAuth } from '../auth/guards';
import { useAuth } from '../auth/AuthContext';
import { loadRows, ContactRow, STORE, rowCanEdit } from '../utils/dataset';
import { findHeader, CONTACT_HEADER_CANDIDATES } from '../utils/headers';
import { saveRowsAndNotify, subscribeStore, replaceDealsFromContacts } from '../utils/crossSync';

function normalizeContacts(raw: Record<string, unknown>[], ownerId?: string): ContactRow[] {
  if (!raw || raw.length===0) return [];
  const headers = Object.keys(raw[0] ?? {});
  const key = findHeader(headers, CONTACT_HEADER_CANDIDATES);
  return raw.map((r, i) => {
    const id = (r['id'] as string) || `c_${Date.now()}_${i}`;
    const contact = (key ? String((r as any)[key] ?? '') : String(r['contact'] ?? '')).trim();
    return { id, contact, ownerId };
  }).filter(r => r.contact);
}

function ContactsInner() {
  const { user } = useAuth();
  const [rows, setRows] = useState<ContactRow[]>(loadRows<ContactRow[]>(STORE.contacts, []));
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ContactRow | null>(null);

  useEffect(() => {
    const off = subscribeStore([STORE.contacts, STORE.deals], () => setRows(loadRows(STORE.contacts, [])));
    return off;
  }, []);

  const filtered = useMemo(()=>{
    const s = q.trim().toLowerCase();
    return rows.filter(r => !s || String(r.contact ?? '').toLowerCase().includes(s));
  }, [rows, q]);

  function persist(next: ContactRow[]) {
    setRows(next);
    saveRowsAndNotify(STORE.contacts, next);
  }

  function onImport(generic: any[]) {
    // ПОЛНАЯ ЗАМЕНА контактов + ownerId загрузившего
    const normalized = normalizeContacts(generic, user?.id);
    persist(normalized);
    // ПОЛНАЯ ЗАМЕНА сделок (зеркало исходных строк) + ownerId загрузившего
    try { replaceDealsFromContacts(generic as any[], user?.id); } catch {}
  }

  function add() { setEditing(null); setOpen(true); }
  function onEdit(row: ContactRow) { setEditing(row); setOpen(true); }
  function onDelete(id: string) { persist(rows.filter(r => r.id !== id)); }
  function onSubmit(row: ContactRow) {
    const withOwner: ContactRow = { ...row, ownerId: row.ownerId ?? user?.id };
    const exists = rows.some(r => r.id === withOwner.id);
    const next = exists ? rows.map(r => (r.id === withOwner.id ? withOwner : r)) : [...rows, { ...withOwner, id: withOwner.id ?? `c_${Date.now()}` }];
    persist(next); setOpen(false);
  }

  return (
    <div className="p-4 grid gap-4">
      <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
        <SearchBar value={q} onChange={setQ} placeholder="Поиск по контактам..." />
        <div className="flex gap-2">
          <UploadExport type="contacts" rows={rows} onImport={onImport} filename="contacts" />
          <button className="glass px-3 py-2 rounded-2xl hover:bg-white/10" onClick={add}>+ Добавить</button>
        </div>
      </div>

      {rows.length === 0 ? (
        <LiquidCard>Загрузите файл с колонкой “Source Name / Contacted person / Contact persons”.</LiquidCard>
      ) : (
        <DataTable<ContactRow>
          rows={filtered}
          columns={[{ key: 'contact', title: 'Контакты' }]}
          onEdit={onEdit}
          onDelete={onDelete}
          canEditRow={(r)=>rowCanEdit(user, r)}
        />
      )}

      <LiquidModal open={open} title={editing ? 'Редактировать контакт' : 'Новый контакт'} onClose={()=>setOpen(false)}>
        <ContactForm initial={editing ?? undefined} onSubmit={onSubmit} onCancel={()=>setOpen(false)} />
      </LiquidModal>
    </div>
  );
}

export default function Contacts() {
  return <RequireAuth><ContactsInner/></RequireAuth>;
}
