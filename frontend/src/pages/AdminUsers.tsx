import { useEffect, useMemo, useState } from 'react'
import LiquidCard from '../components/LiquidCard'
import FullBleed from '../components/FullBleed'
import AutoScale from '../components/AutoScale'
import DataTable from '../components/DataTable'
import { useAuth } from '../auth/AuthContext'
import { apiFetch } from '../api/client'
import LiquidModal from '../components/LiquidModal'
import Forbidden from './Forbidden'

type User = { id: string; email: string; name: string; role: 'admin'|'employee'; verified: boolean; created_at: string; last_login?: string | null }

export default function AdminUsers() {
  const { user } = useAuth()
  const [rows, setRows] = useState<User[]>([])
  const [err, setErr] = useState<string|null>(null)

  function fmt(ts?: string | null){
    if (!ts) return '—'
    const s = String(ts)
    if (s.includes('T')) return s.replace('T',' ').slice(0,19)
    return s.slice(0,19)
  }
  async function load(){
    try {
      const list = await apiFetch<User[]>('/users')
      const normalized = list.map(u => ({ ...u, last_login: fmt(u.last_login) }))
      setRows(normalized)
    } catch(e:any){ setErr(e?.message||'Failed') }
  }
  useEffect(()=>{
    load()
    const onImported = () => load()
    window.addEventListener('crm:imported', onImported as any)
    return () => window.removeEventListener('crm:imported', onImported as any)
  },[])

  const columns = useMemo(()=>[
    { key: 'email', title:'Email', nowrap:true },
    { key: 'name', title:'Name', nowrap:true },
    { key: 'role', title:'Role', nowrap:true },
    { key: 'verified', title:'Verified', nowrap:true },
    { key: 'created_at', title:'Created', nowrap:true },
    { key: 'last_login', title:'Last login', nowrap:true },
    { key: '_new_password', title:'New password', nowrap:true },
  ],[])

  async function onEdit(row: any){
    // старт инлайн-редактирования
    setEditingId(String(row.id))
    setRowDraft({
      email: row.email,
      name: row.name,
      role: row.role,
      verified: row.verified,
      _new_password: '',
    })
  }
  async function onDelete(id: string){
    await apiFetch(`/users/${id}`, { method:'DELETE' })
    await load()
  }

  if (!user || user.role !== 'admin') return <Forbidden />

  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<{email:string; name:string; role:'admin'|'employee'; password:string}>({ email:'', name:'', role:'employee', password:'' })
  async function addUser(){ setDraft({ email:'', name:'', role:'employee', password:'' }); setOpen(true) }
  async function saveUser(){
    const { email, name, role, password } = draft
    if (!email || !password) { setErr('Email and Password are required'); return }
    await apiFetch('/auth/register', { method:'POST', body: JSON.stringify({ email, name: name||email, role, password }) })
    setOpen(false)
    await load()
  }

  async function exportUsers(){
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'users.json'; a.click(); URL.revokeObjectURL(url)
  }

  // inline edit state & handlers
  const [editingId, setEditingId] = useState<string|null>(null)
  const [rowDraft, setRowDraft] = useState<{email:string; name:string; role:'admin'|'employee'; verified:boolean; _new_password?: string} | null>(null)
  function onChangeDraft(key: string, value: string){
    setRowDraft(prev => ({ ...(prev as any), [key]: value }) as any)
  }
  async function onSaveEdit(){
    if (!editingId || !rowDraft) return
    const body:any = { }
    if (rowDraft.email) body.email = rowDraft.email
    if (rowDraft.name) body.name = rowDraft.name
    if (rowDraft.role) body.role = rowDraft.role
    if (typeof rowDraft.verified !== 'undefined') body.verified = rowDraft.verified
    await apiFetch(`/users/${editingId}`, { method:'PUT', body: JSON.stringify(body) })
    if (rowDraft._new_password) {
      await apiFetch(`/users/${editingId}/password`, { method:'PUT', body: JSON.stringify({ new_password: rowDraft._new_password }) })
    }
    setEditingId(null); setRowDraft(null)
    await load()
  }
  function onCancelEdit(){ setEditingId(null); setRowDraft(null) }

  return (
    <div className="p-4 grid gap-4">
      {err && <div className="glass pill px-3 py-2 text-red-300">{err}</div>}
      <FullBleed>
        <AutoScale deps={[rows.length, (columns as any).length]} onScale={(k)=>{ try { document.documentElement.style.setProperty('--ui-scale', String(k)); } catch {} }}>
          <LiquidCard title="Users" actions={
            <div className="flex gap-2">
              <button className="glass px-3 py-1.5 rounded-xl" onClick={()=> load()}>Reset filters</button>
              <button className="glass px-3 py-1.5 rounded-xl" onClick={addUser}>Add</button>
            </div>
          }>
            <DataTable rows={rows as any}
              columns={columns as any}
              onEdit={onEdit}
              onDelete={onDelete}
              rightAlign={false}
              fullWidth
              editingId={editingId}
              editDraft={rowDraft as any}
              onChangeDraft={onChangeDraft}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
            />
          </LiquidCard>
        </AutoScale>
      </FullBleed>
      <LiquidModal open={open} title="Add user" onClose={()=>setOpen(false)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="grid gap-1">
            <span className="text-xs opacity-80">Email</span>
            <input className="glass px-3 py-2 rounded-2xl" value={draft.email} onChange={e=>setDraft(prev=>({...prev, email: e.target.value.trim()}))} />
          </label>
          <label className="grid gap-1">
            <span className="text-xs opacity-80">Name</span>
            <input className="glass px-3 py-2 rounded-2xl" value={draft.name} onChange={e=>setDraft(prev=>({...prev, name: e.target.value}))} />
          </label>
          <label className="grid gap-1">
            <span className="text-xs opacity-80">Role</span>
            <select className="glass px-3 py-2 rounded-2xl" value={draft.role} onChange={e=>setDraft(prev=>({...prev, role: e.target.value as any}))}>
              <option value="employee">employee</option>
              <option value="admin">admin</option>
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-xs opacity-80">Password</span>
            <input type="password" className="glass px-3 py-2 rounded-2xl" value={draft.password} onChange={e=>setDraft(prev=>({...prev, password: e.target.value}))} />
          </label>
        </div>
        <div className="flex items-center mt-4">
          <button className="glass px-4 py-2 rounded-2xl hover:bg-white/10" onClick={()=>setOpen(false)}>Cancel</button>
          <button className="ml-auto glass px-4 py-2 rounded-2xl hover:bg-white/10" onClick={saveUser}>Save</button>
        </div>
      </LiquidModal>
    </div>
  )
}


