import { useEffect, useMemo, useState } from 'react';
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

function normalizeContactsForImport(raw: Record<string, unknown>[]): Record<string, any>[] {
  if (!raw || raw.length === 0) return [];
  
  const contacts: Array<{ contact: string }> = [];
  const seen = new Set<string>();
  
  // Извлекаем контакты из всех возможных колонок
  for (const row of raw) {
    // Проверяем все колонки с контактами
    const advisor = String(row['Advisor'] ?? '').trim();
    const sourceName = String(row['Source Name'] ?? '').trim();
    const contactedPerson = String(row['Contacted person'] ?? '').trim();
    const contactPersons = String(row['Contact persons'] ?? '').trim();
    
    // Добавляем уникальные контакты из всех колонок
    [advisor, sourceName, contactedPerson, contactPersons].forEach(contact => {
      if (contact && !seen.has(contact)) {
        seen.add(contact);
        contacts.push({ contact });
      }
    });
  }
  
  return contacts;
}

function ContactsInner() {
  const { user } = useAuth();
  const [rows, setRows] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ContactRow | null>(null);

  // Загрузка контактов из API
  const loadContacts = async () => {
    try {
      setLoading(true);
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
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter(r => !s || String(r.contact ?? '').toLowerCase().includes(s));
  }, [rows, q]);

  async function onImport(generic: any[]) {
    try {
      const normalized = normalizeContactsForImport(generic);
      if (normalized.length === 0) {
        alert('Нет данных для импорта');
        return;
      }
      
      await API.importContacts({ contacts: normalized });
      await loadContacts(); // Перезагружаем список
    } catch (err: any) {
      alert(`Ошибка импорта: ${err.message}`);
    }
  }

  function add() { setEditing(null); setOpen(true); }
  function onEdit(row: ContactRow) { setEditing(row); setOpen(true); }
  
  async function onDelete(id: string) {
    if (!confirm('Удалить контакт?')) return;
    try {
      await API.deleteContact(id);
      await loadContacts();
    } catch (err: any) {
      alert(`Ошибка удаления: ${err.message}`);
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
      alert(`Ошибка сохранения: ${err.message}`);
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <LiquidCard>Загрузка контактов...</LiquidCard>
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
            onClick={loadContacts}
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
        <SearchBar value={q} onChange={setQ} placeholder="Поиск по контактам..." />
        <div className="flex gap-2">
          <UploadExport type="contacts" rows={rows} onImport={onImport} filename="contacts" />
          <button className="glass px-3 py-2 rounded-2xl hover:bg-white/10" onClick={add}>+ Добавить</button>
        </div>
      </div>

      {rows.length === 0 ? (
        <LiquidCard>
          Нет контактов. Добавьте контакт или загрузите CSV файл.
        </LiquidCard>
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
