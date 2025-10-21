import { useMemo, useState, useEffect } from 'react';
// no redirect after import
import SearchBar from '../components/SearchBar';
import DataTable, { ColumnDef } from '../components/DataTable';
import UploadExport from '../components/UploadExport';
import LiquidModal from '../components/LiquidModal';
import LiquidCard from '../components/LiquidCard';
import DealForm from '../components/DealForm';
import AutoScale from '../components/AutoScale';
import FullBleed from '../components/FullBleed';
import { RequireAuth } from '../auth/guards';
import { useAuth } from '../auth/AuthContext';
import { rowCanEdit, DealRow } from '../utils/dataset';
import { stripInternalKeys } from '../utils/headers';
import * as API from '../api';

const S = (v: unknown) => String(v ?? '').trim();

// Преобразование API Deal в DealRow (backend → frontend)
function toDealRow(apiDeal: API.Deal): DealRow {
  return {
    id: apiDeal.id,
    ownerId: apiDeal.owner_id,
    ...apiDeal.data
  };
}

// Преобразование DealRow в API формат (frontend → backend)
function fromDealRow(row: DealRow): Record<string, any> {
  const { id, ownerId, ...data } = row;
  return data;
}

function buildColumns(rows: DealRow[]): ColumnDef<DealRow>[] {
  const unionKeys = new Set<string>();
  rows.forEach(r => Object.keys(stripInternalKeys(r)).forEach(k => unionKeys.add(k)));
  return Array.from(unionKeys).map((k) => ({
    key: k,
    title: k,
    nowrap: ['Company','Source Name','Next connection','Comments'].includes(k as string),
    className: k === 'Comments' ? 'max-w-[28rem]' : ''
  }));
}

function detectKnownDealsSchema(rows: any[]): 'pipeline' | 'companies' | 'advisors' | 'investors' | null {
  const sample = rows?.[0] ?? {};
  const keys = Object.keys(sample || {}).map(k => String(k ?? '').trim().toLowerCase());
  const has = (k: string) => keys.includes(k.toLowerCase());
  if (has('advisor')) return 'advisors';
  if (has('investor')) return 'investors';
  if (has('methods to reach out')) return 'companies';
  if (has('source name')) return 'pipeline';
  return null;
}

function DealsInner() {
  const { user } = useAuth();
  const [rows, setRows] = useState<DealRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DealRow | null>(null);
  const [columns, setColumns] = useState<ColumnDef<DealRow>[]>([]);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, Set<string>>>({});
  const [sort, setSort] = useState<{ key: string | null; dir: 'asc' | 'desc' | null }>({ key: null, dir: null });
  const [menu, setMenu] = useState<{ key: string; x: number; y: number } | null>(null);
  const [useFullBleed, setUseFullBleed] = useState(false);

  // Загрузка сделок из API
  const loadDeals = async () => {
    try {
      setLoading(true);
      setErrorBanner(null);
      setError(null);
      const deals = await API.getDeals();
      const transformed = deals.map(toDealRow);
      setRows(transformed);
      setColumns(buildColumns(transformed));
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки сделок');
      console.error('Ошибка загрузки сделок:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeals();
    const h = (e: any) => { loadDeals(); const n = e?.detail?.rows; setToast(`Success ${n ?? ''} rows added`.trim()); setTimeout(()=>setToast(null), 6000) }
    const he = (e: any) => { setErrorBanner(e?.detail?.message || "Incorrect file wasn't imported"); setTimeout(()=>setErrorBanner(null), 6000) }
    window.addEventListener('crm:imported', h as any)
    window.addEventListener('crm:import-error', he as any)
    return () => { window.removeEventListener('crm:imported', h as any); window.removeEventListener('crm:import-error', he as any) }
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    let base = rows;
    // value filters per column
    const activeCols = Object.keys(selected).filter(k => (selected[k]?.size ?? 0) > 0);
    if (activeCols.length > 0) {
      base = base.filter(r => {
        for (const k of activeCols) {
          const need = selected[k]!;
          if (!need.has(S((r as any)[k]))) return false;
        }
        return true;
      });
    }
    // search
    if (s) {
      base = base.filter(r => Object.values(r).some(v => String(v ?? '').toLowerCase().includes(s)));
    }
    // sort
    if (sort.key && sort.dir) {
      const dir = sort.dir === 'asc' ? 1 : -1;
      base = [...base].sort((a,b)=> S((a as any)[sort.key!]).localeCompare(S((b as any)[sort.key!]), undefined, { sensitivity:'base', numeric:true }) * dir);
    }
    return base;
  }, [rows, q, selected, sort]);

  async function onImport(newRows: any[]) {
    try {
      setErrorBanner(null);
      if (!newRows || newRows.length === 0) { setErrorBanner('Файл пустой — нет строк для импорта.'); return; }
      const headers = Object.keys(newRows[0] ?? {}).map(h => String(h ?? '').trim().toLowerCase());
      const hasAnyHeader = headers.some(h => h && h !== '__parsed_extra');
      const hasAnyValue = newRows.some(r => Object.entries(r ?? {}).filter(([k]) => String(k ?? '').trim() !== '' && k !== '__parsed_extra').some(([,v]) => v !== null && String(v ?? '').trim() !== ''));
      if (!hasAnyHeader || !hasAnyValue) { setErrorBanner('Неизвестный или пустой формат файла. Проверьте заголовки и содержимое.'); return; }
      const schema = detectKnownDealsSchema(newRows);
      if (!schema) {
        setErrorBanner('Неизвестный формат файла. Поддерживаются: Pipeline, Companies trying to reach, List of advisors, List of investors.');
        return;
      }
      // MVP: очищаем все сделки перед импортом, чтобы показывать только последний файл
      await API.deleteAllDeals();
      await API.importDeals({ deals: newRows });
      // Авто-синк контактов: пробуем извлечь контакты из нового файла и синхронизировать
      try {
        const candidates = ['Investor','Source Name','Contacted person','Contact persons'] as const
        let col: string | null = null
        for (const k of candidates) {
          if (newRows.some(r => String(r[k] ?? '').trim().length > 0)) { col = k; break }
        }
        if (col) {
          const seen = new Set<string>()
          const contacts = newRows
            .map(r => String(r[col as any] ?? '').trim())
            .filter(v => v && !seen.has(v) && seen.add(v))
            .map(v => ({ contact: v }))
          if (contacts.length) {
            await API.deleteAllContacts()
            await API.importContacts({ contacts })
            try { localStorage.setItem('contacts_active_column', col) } catch {}
          }
        }
      } catch {}
      await loadDeals();
    } catch (err: any) {
      setErrorBanner(err.message || 'Ошибка импорта файла');
    }
  }

  // unique values for a column
  const uniqueFor = (k: string): string[] => {
    const set = new Set<string>();
    rows.forEach(r => { const v = S((r as any)[k]); if (v) set.add(v); });
    return Array.from(set).sort((a,b)=>a.localeCompare(b));
  };

  const toggleVal = (k: string, v: string) => {
    setSelected(prev => {
      const next = { ...prev } as Record<string, Set<string>>;
      const cur = new Set(next[k] ?? []);
      cur.has(v) ? cur.delete(v) : cur.add(v);
      next[k] = cur;
      return next;
    });
  };

  function add() { setEditing(null); setOpen(true); }
  function onEdit(row: DealRow) { setEditing(row); setOpen(true); }
  
  async function onDelete(id: string) {
    if (!confirm('Delete deal?')) return;
    try {
      await API.deleteDeal(id);
      await loadDeals();
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  }
  
  async function onSubmit(row: DealRow) {
    try {
      const dealData = fromDealRow(row);
      
      if (editing) {
        // Обновление существующей
        await API.updateDeal(editing.id, { data: dealData });
      } else {
        // Создание новой
        await API.createDeal({ data: dealData });
      }
      await loadDeals();
      setOpen(false);
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <LiquidCard>Loading deals...</LiquidCard>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <LiquidCard>
          <div className="text-red-400">Ошибка: {error}</div>
          <button 
            className="mt-2 glass px-3 py-2 rounded-2xl hover:bg-white/10" 
            onClick={loadDeals}
          >
            Повторить
          </button>
        </LiquidCard>
      </div>
    );
  }

  return (
    <div className="p-2 grid gap-3">
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
        <SearchBar value={q} onChange={setQ} placeholder="Search deals..." />
        <div className="flex gap-2 items-center">
          {/* import/export moved to topbar */}
          <button className="glass px-3 py-2 rounded-2xl hover:bg-white/10" onClick={add}>+ Add</button>
          <button
            className="glass px-2 py-1 rounded-xl border border-white/20"
            onClick={()=> { setSelected({}); setOpenKey(null); setSort({ key:null, dir:null }); setQ(''); }}
          >
            Reset filters
          </button>
        </div>
      </div>

      {/* Filters row: pick a column, then values, and sort */}
      {/* Controls are aligned with Contacts (Reset next to Add) */}

      {openKey && (
        <div className="glass rounded-2xl p-3 border border-black/10">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm opacity-80">Filter: {openKey}</div>
            <button className="glass px-2 py-1 rounded-xl border border-white/20" onClick={()=>setOpenKey(null)}>Close</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {uniqueFor(openKey).map(v => (
              <button key={v}
                className={`px-3 py-1 rounded-full border transition ${selected[openKey]?.has(v)?'bg-white/20 border-white/50':'bg-white/10 border-white/25 hover:bg-white/14'}`}
                onClick={()=>toggleVal(openKey, v)}
              >{v}</button>
            ))}
          </div>
        </div>
      )}

      {menu && (
        <div
          className="glass rounded-2xl p-3 border border-black/10 fixed z-50"
          style={{ top: menu.y + 6, left: Math.max(12, menu.x - 150), minWidth: 220, maxWidth: 320 }}
          onMouseLeave={()=>setMenu(null)}
        >
          <div className="text-sm opacity-80 mb-2">{menu.key}</div>
          <div className="flex items-center gap-2 mb-2">
            <button className="glass px-2 py-1 rounded-xl border border-white/20" onClick={()=>{ setSort({ key:menu.key, dir:'asc' }); }}>Sort A→Z</button>
            <button className="glass px-2 py-1 rounded-xl border border-white/20" onClick={()=>{ setSort({ key:menu.key, dir:'desc' }); }}>Sort Z→A</button>
          </div>
          <div className="max-h-60 overflow-auto grid grid-cols-1 gap-2">
            {uniqueFor(menu.key).map(v => (
              <button key={v}
                className={`px-3 py-1 rounded-full border transition ${selected[menu.key]?.has(v)?'bg-white/20 border-white/50':'bg-white/10 border-white/25 hover:bg-white/14'}`}
                onClick={()=>toggleVal(menu.key, v)}
              >{v}</button>
            ))}
          </div>
        </div>
      )}

      {rows.length === 0 ? (
        <LiquidCard>
          No deals. Click “Add” or use Import in the header.
        </LiquidCard>
      ) : (
        <>
          {useFullBleed ? (
            <FullBleed>
              <AutoScale deps={[columns, filtered.length]} onScale={(k)=>{ if (k>0.98) setUseFullBleed(false); }}>
                <DataTable<DealRow>
                  rows={filtered}
                  columns={columns}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  canEditRow={(r)=>rowCanEdit(user, r)}
                  onHeaderClick={(k)=> setSort(s=> s.key===k ? { key:k, dir: s.dir==='asc'?'desc':'asc' } : { key:k, dir:'asc' })}
                  onHeaderMenu={(k, rect)=> { setMenu({ key:k, x: rect.right, y: rect.bottom }); setOpenKey(null); }}
                />
              </AutoScale>
            </FullBleed>
          ) : (
            <AutoScale deps={[columns, filtered.length]} onScale={(k)=>{ if (k<0.95) setUseFullBleed(true); }}>
              <DataTable<DealRow>
                rows={filtered}
                columns={columns}
                onEdit={onEdit}
                onDelete={onDelete}
                canEditRow={(r)=>rowCanEdit(user, r)}
                onHeaderClick={(k)=> setSort(s=> s.key===k ? { key:k, dir: s.dir==='asc'?'desc':'asc' } : { key:k, dir:'asc' })}
                onHeaderMenu={(k, rect)=> { setMenu({ key:k, x: rect.right, y: rect.bottom }); setOpenKey(null); }}
              />
            </AutoScale>
          )}
        </>
      )}

      <LiquidModal open={open} title={editing ? 'Edit deal' : 'New deal'} onClose={()=>setOpen(false)}>
        <DealForm
          initial={editing ?? undefined}
          fields={columns.map(c => String(c.key))}
          onSubmit={onSubmit}
          onCancel={()=>setOpen(false)}
        />
      </LiquidModal>
    </div>
  );
}

export default function Deals() {
  return <RequireAuth><DealsInner/></RequireAuth>;
}
