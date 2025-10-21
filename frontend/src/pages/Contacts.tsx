import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import DataTable from '../components/DataTable';
import UploadExport from '../components/UploadExport';
import LiquidCard from '../components/LiquidCard';
import LiquidModal from '../components/LiquidModal';
import ContactForm from '../components/ContactForm';
import { RequireAuth } from '../auth/guards';
import { useAuth } from '../auth/AuthContext';
import { ContactRow, rowCanEdit } from '../utils/dataset';
import * as API from '../api';

// Преобразование API Contact в ContactRow
function toContactRow(apiContact: API.Contact): ContactRow {
  return {
    id: apiContact.id,
    contact: apiContact.contact,
    ownerId: apiContact.owner_id
  };
}

function detectContactColumn(raw: Record<string, unknown>[]): { key: string | null, rows: Array<{ contact: string }> } {
  if (!raw || raw.length === 0) return [];
  
  // Приоритет столбцов: Investor → Source Name → Contacted person → Contact persons
  const candidates = ['Investor','Source Name','Contacted person','Contact persons'] as const;
  const seen = new Set<string>();
  let chosen: string | null = null;
  let out: Array<{ contact: string }> = [];

  for (const key of candidates) {
    const acc: Array<{ contact: string }> = [];
    seen.clear();
    for (const row of raw) {
      const v = String((row as any)[key] ?? '').trim();
      if (v && !seen.has(v)) { seen.add(v); acc.push({ contact: v }); }
    }
    if (acc.length > 0) { chosen = key; out = acc; break; }
  }
  return { key: chosen, rows: out } as any;
}

function ContactsInner() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rows, setRows] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ContactRow | null>(null);
  const [activeColumn, setActiveColumn] = useState<string>(
    typeof window !== 'undefined' ? (localStorage.getItem('contacts_active_column') || 'Contacts') : 'Contacts'
  );
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ x:number; y:number }|null>(null);
  const [sortDir, setSortDir] = useState<'asc'|'desc'|null>(
    typeof window !== 'undefined' ? ((localStorage.getItem('contacts_sort_dir') as 'asc'|'desc'|null) ?? null) : null
  );

  // Загрузка контактов из API
  const loadContacts = async () => {
    try {
      setLoading(true);
      setErrorBanner(null);
      setError(null);
      const contacts = await API.getContacts();
      setRows(contacts.map(toContactRow));
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки контактов');
      console.error('Ошибка загрузки контактов:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
    const h = () => { loadContacts(); const col = localStorage.getItem('contacts_active_column'); if (col) setActiveColumn(col); setToast('Success: data refreshed'); setTimeout(()=>setToast(null), 6000) }
    const he = (e: any) => { setErrorBanner(e?.detail?.message || "Incorrect file wasn't imported"); setTimeout(()=>setErrorBanner(null), 6000) }
    window.addEventListener('crm:imported', h as any)
    window.addEventListener('crm:import-error', he as any)
    return () => { window.removeEventListener('crm:imported', h as any); window.removeEventListener('crm:import-error', he as any) }
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    let base = rows;
    if (s) base = base.filter(r => String(r.contact ?? '').toLowerCase().includes(s));
    // sort A→Z by contact only (toggle on click)
    if (sortDir) {
      const dir = sortDir==='asc' ? 1 : -1;
      base = [...base].sort((a,b)=> String(a.contact ?? '').localeCompare(String(b.contact ?? ''), undefined, {sensitivity:'base'}) * dir);
    }
    return base;
  }, [rows, q, sortDir]);

  async function onImport(generic: any[]) {
    try {
      setErrorBanner(null);
      const { key, rows: normalized } = detectContactColumn(generic as any);
      if (!key || normalized.length === 0) {
        setErrorBanner('Не удалось определить колонку контактов (Investor/Source Name/Contacted person/Contact persons) или файл пустой.');
        return;
      }
      setActiveColumn(key);
      try { localStorage.setItem('contacts_active_column', key); } catch {}
      // MVP: очищаем все контакты перед импортом, чтобы отображать последний загруженный набор
      await API.deleteAllContacts();
      await API.importContacts({ contacts: normalized });
      // Синхронизируем сделки тем же файлом (MVP: показываем последний загруженный набор и в сделках)
      await API.deleteAllDeals();
      await API.importDeals({ deals: generic as any[] });
      await loadContacts();
    } catch (err: any) {
      setErrorBanner(err.message || 'Ошибка импорта файла');
    }
  }

  function add() { setEditing(null); setOpen(true); }
  function onEdit(row: ContactRow) { setEditing(row); setOpen(true); }
  
  async function onDelete(id: string) {
    if (!confirm('Delete contact?')) return;
    try {
      await API.deleteContact(id);
      await loadContacts();
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  }
  
  async function onSubmit(row: ContactRow) {
    try {
      if (editing) {
        // Обновление существующего
        await API.updateContact(editing.id, { contact: row.contact });
      } else {
        // Создание нового
        await API.createContact({ contact: row.contact });
      }
      await loadContacts();
      setOpen(false);
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <LiquidCard>Loading contacts...</LiquidCard>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <LiquidCard>
          <div className="text-red-400">Error: {error}</div>
          <button 
            className="mt-2 glass px-3 py-2 rounded-2xl hover:bg-white/10" 
            onClick={loadContacts}
          >
            Retry
          </button>
        </LiquidCard>
      </div>
    );
  }

  return (
    <div className="p-4 grid gap-4">
      {toast && (
        <div
          className="rounded-xl p-2 px-3 border border-emerald-300/60 bg-emerald-600 text-white shadow-lg ml-auto max-w-md font-semibold"
          style={{ marginTop: -6 }}
        >
          {toast}
        </div>
      )}
      {errorBanner && (
        <div className="rounded-xl p-3 border border-red-300/70 bg-red-600 text-white shadow-lg ml-auto max-w-xl font-semibold" style={{marginTop:-6}}>
          {errorBanner}
        </div>
      )}
      <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
        <SearchBar value={q} onChange={setQ} placeholder="Search contacts..." />
        <div className="flex gap-2 items-center">
          {/* import/export moved to topbar */}
          <button className="glass px-3 py-2 rounded-2xl hover:bg-white/10" onClick={add}>+ Add</button>
          <button className="glass px-2 py-1 rounded-xl border border-white/20"
            onClick={()=> { setQ(''); setSortDir(null); try { localStorage.setItem('contacts_sort_dir',''); } catch {}; }}
          >Reset filters</button>
        </div>
      </div>

      {rows.length === 0 ? (
        <LiquidCard>
          No contacts. Click “Add” or use Import in the header.
        </LiquidCard>
      ) : (
        <>
          <DataTable<ContactRow>
            rows={filtered}
            columns={[{ key: 'contact', title: activeColumn || 'Contacts' }]}
            onEdit={onEdit}
            onDelete={onDelete}
            canEditRow={(r)=>rowCanEdit(user, r)}
            rightAlign={false}
            onHeaderClick={()=>{
              const next = sortDir === null ? 'asc' : (sortDir === 'asc' ? 'desc' : null);
              setSortDir(next);
              try { localStorage.setItem('contacts_sort_dir', next ?? ''); } catch {}
            }}
            onHeaderMenu={(k, rect)=> setMenu({ x: rect.right, y: rect.bottom })}
          />

          {menu && (
            <div
              className="glass rounded-2xl p-3 border border-black/10 fixed z-50"
              style={{ top: menu.y + 8, left: menu.x - 140, width: 220 }}
              onMouseLeave={()=>setMenu(null)}
            >
              <div className="text-sm opacity-80 mb-2">Contacts</div>
              <div className="flex items-center gap-2">
                <button className="glass px-2 py-1 rounded-xl border border-white/20"
                  onClick={()=>{ setSortDir('asc'); try { localStorage.setItem('contacts_sort_dir','asc'); } catch {}; }}
                >Sort A→Z</button>
                <button className="glass px-2 py-1 rounded-xl border border-white/20"
                  onClick={()=>{ setSortDir('desc'); try { localStorage.setItem('contacts_sort_dir','desc'); } catch {}; }}
                >Sort Z→A</button>
              </div>
            </div>
          )}
        </>
      )}

      <LiquidModal open={open} title={editing ? 'Edit contact' : 'New contact'} onClose={()=>setOpen(false)}>
        <ContactForm initial={editing ?? undefined} onSubmit={onSubmit} onCancel={()=>setOpen(false)} title={activeColumn || 'Contact'} />
      </LiquidModal>
    </div>
  );
}

export default function Contacts() {
  return <RequireAuth><ContactsInner/></RequireAuth>;
}
