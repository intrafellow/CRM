import { useMemo, useState, useEffect } from 'react';
import SearchBar from '../components/SearchBar';
import DataTable, { ColumnDef } from '../components/DataTable';
import UploadExport from '../components/UploadExport';
import LiquidModal from '../components/LiquidModal';
import LiquidCard from '../components/LiquidCard';
import DealForm from '../components/DealForm';
import { RequireAuth } from '../auth/guards';
import { useAuth } from '../auth/AuthContext';
import { rowCanEdit, DealRow } from '../utils/dataset';
import { stripInternalKeys } from '../utils/headers';
import * as API from '../api';

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
  const [rows, setRows] = useState<DealRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DealRow | null>(null);
  const [columns, setColumns] = useState<ColumnDef<DealRow>[]>([]);

  // Загрузка сделок из API
  const loadDeals = async () => {
    try {
      setLoading(true);
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
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(r => Object.values(r).some(v => String(v ?? '').toLowerCase().includes(s)));
  }, [rows, q]);

  async function onImport(newRows: any[]) {
    try {
      if (!newRows || newRows.length === 0) {
        alert('Нет данных для импорта');
        return;
      }
      
      await API.importDeals({ deals: newRows });
      await loadDeals(); // Перезагружаем список
    } catch (err: any) {
      alert(`Ошибка импорта: ${err.message}`);
    }
  }

  function add() { setEditing(null); setOpen(true); }
  function onEdit(row: DealRow) { setEditing(row); setOpen(true); }
  
  async function onDelete(id: string) {
    if (!confirm('Удалить сделку?')) return;
    try {
      await API.deleteDeal(id);
      await loadDeals();
    } catch (err: any) {
      alert(`Ошибка удаления: ${err.message}`);
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
      alert(`Ошибка сохранения: ${err.message}`);
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <LiquidCard>Загрузка сделок...</LiquidCard>
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
    <div className="p-4 grid gap-4">
      <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
        <SearchBar value={q} onChange={setQ} placeholder="Поиск по сделкам..." />
        <div className="flex gap-2">
          <UploadExport type="deals" rows={rows} onImport={onImport} filename="deals" />
          <button className="glass px-3 py-2 rounded-2xl hover:bg-white/10" onClick={add}>+ Добавить</button>
        </div>
      </div>

      {rows.length === 0 ? (
        <LiquidCard>
          Нет сделок. Добавьте сделку или загрузите CSV файл.
        </LiquidCard>
      ) : (
        <DataTable<DealRow>
          rows={filtered}
          columns={columns}
          onEdit={onEdit}
          onDelete={onDelete}
          canEditRow={(r)=>rowCanEdit(user, r)}
        />
      )}

      <LiquidModal open={open} title={editing ? 'Редактировать сделку' : 'Новая сделка'} onClose={()=>setOpen(false)}>
        <DealForm initial={editing ?? undefined} onSubmit={onSubmit} onCancel={()=>setOpen(false)} />
      </LiquidModal>
    </div>
  );
}

export default function Deals() {
  return <RequireAuth><DealsInner/></RequireAuth>;
}
