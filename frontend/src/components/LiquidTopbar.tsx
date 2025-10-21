import { Link, useLocation } from 'react-router-dom'
import { useRef, useState } from 'react'
import * as API from '../api'
import { importFromCSV, exportToCSV } from '../utils/csv'
import { importFromXLSX, exportToXLSX } from '../utils/xlsx'
import { useAuth } from '../auth/AuthContext'
import { apiFetch } from '../api/client'

export default function LiquidTopbar() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const isAuthPage = /^\/(login|register|verify)/.test(pathname)
  const [status, setStatus] = useState<string | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const tabs = [
    { to: '/', label: 'Dashboard' },
    { to: '/pipeline', label: 'Pipeline' },
    { to: '/companies', label: 'Companies to reach' },
    { to: '/advisors', label: 'Advisors' },
    { to: '/investors', label: 'Investors' },
  ]

  async function handleImport(file: File) {
    try {
      const name = file.name.toLowerCase()
      let parsed: any[] = []
      if (name.endsWith('.csv')) parsed = await importFromCSV<any>(file)
      else if (name.endsWith('.xlsx') || name.endsWith('.xls')) parsed = await importFromXLSX<any>(file)
      else return

      // helpers
      const lower = (s: any) => String(s ?? '').trim().toLowerCase()
      const headers = Object.keys(parsed[0] ?? {})
      const headersLower = headers.map(lower)
      const hasAnyHeader = headersLower.some(h => h && h !== '__parsed_extra')
      const rowHasAnyValue = (r: any) => Object.entries(r ?? {})
        .filter(([k]) => lower(k) !== '' && lower(k) !== '__parsed_extra')
        .some(([,v]) => v !== null && String(v ?? '').trim() !== '')
      const hasAnyValue = parsed.some(rowHasAnyValue)
      if (!hasAnyHeader || !hasAnyValue) {
        try { window.dispatchEvent(new CustomEvent('crm:import-error', { detail: { message: "Incorrect file wasn't imported" } })) } catch {}
        setStatus("Incorrect file wasn't imported")
        setTimeout(()=>setStatus(null), 6000)
        return
      }

      // Expected headers per tab
      const EXPECTED: Record<string, string[]> = {
        '/pipeline': ['Company','Date','Sector','Seniot','Junior team','Source','Source Name','Type','Size, RUB mn','Status','Next connection','Comments'],
        '/companies': ['Company','Sector','Contacted person','Methods to reach out','Status','Comments'],
        '/advisors': ['Advisor','Contact persons','Type','Comment','Responsible','Date of the last meeting of the responsible person','Months since the last meeting'],
        '/investors': ['Investor','Connection','Target ticket','Target sectors','Relevant?','Comments','Discussed fund','Discussed A3','Discussed Lab Vkusa'],
      }
      const base = Object.keys(EXPECTED).find(k => pathname.startsWith(k)) || ''
      const required = EXPECTED[base]
      // Special case: admin users import
      if (!required && pathname.startsWith('/admin/users')) {
        const norm = (s:any) => String(s??'').trim()
        const headersUp = headers.map(h=>h.trim())
        const need = ['Email','Password']
        if (!need.every(n => headersUp.includes(n))) {
          setStatus('Error: Incorrect file for Users (need Email, Password)')
          setTimeout(()=>setStatus(null), 6000)
          return
        }
        const cleaned = parsed.filter(rowHasAnyValue)
        let ok = 0
        for (const row of cleaned) {
          const email = norm(row['Email']); const password = norm(row['Password'])
          if (!email || !password) continue
          const name = norm(row['Name'] ?? email)
          const role = (norm(row['Role']) as any) === 'admin' ? 'admin' : 'employee'
          try { await apiFetch('/auth/register', { method:'POST', body: JSON.stringify({ email, password, name, role }) }) ; ok++ } catch {}
        }
        const msg = `Success ${ok} users added`
        setStatus(msg)
        try { window.dispatchEvent(new CustomEvent('crm:imported', { detail: { rows: ok, message: msg } })) } catch {}
        setTimeout(()=>setStatus(null), 6000)
        return
      }
      if (!required) {
        try { window.dispatchEvent(new CustomEvent('crm:import-error', { detail: { message: 'Open a specific tab to import' } })) } catch {}
        setStatus('Open a specific tab to import')
        setTimeout(()=>setStatus(null), 6000)
        return
      }
      const requiredLower = required.map(lower)
      const hasAllRequired = requiredLower.every(r => headersLower.includes(r))
      if (!hasAllRequired) {
        try { window.dispatchEvent(new CustomEvent('crm:import-error', { detail: { message: 'Incorrect file for current tab' } })) } catch {}
        setStatus('Error: Incorrect file for current tab')
        setTimeout(()=>setStatus(null), 6000)
        return
      }

      // drop completely empty rows
      const cleaned = parsed.filter(rowHasAnyValue)

      // deduplicate against existing rows for the active tab
      const normalize = (row: any) => {
        const obj: Record<string,string> = {}
        Object.keys(row || {}).forEach(k => {
          const key = String(k)
          if (!key || key === '__parsed_extra') return
          const v = String((row as any)[k] ?? '').trim()
          obj[key] = v
        })
        // stable stringify
        return JSON.stringify(Object.keys(obj).sort().reduce((a,k)=>{ (a as any)[k]=obj[k]; return a }, {} as Record<string,string>))
      }

      let existingFingerprints = new Set<string>()
      if (base === '/pipeline') {
        const xs = await API.getPipeline()
        existingFingerprints = new Set(xs.map(x => normalize(x.data)))
      } else if (base === '/companies') {
        const xs = await API.getCompanies()
        existingFingerprints = new Set(xs.map(x => normalize(x.data)))
      } else if (base === '/advisors') {
        const xs = await API.getAdvisors()
        existingFingerprints = new Set(xs.map(x => normalize(x.data)))
      } else if (base === '/investors') {
        const xs = await API.getInvestors()
        existingFingerprints = new Set(xs.map(x => normalize(x.data)))
      }

      const uniqueRows = cleaned.filter(r => !existingFingerprints.has(normalize(r)))

      // Import into active tab (append, skip duplicates)
      if (uniqueRows.length > 0) {
        if (base === '/pipeline') {
          await API.importPipeline({ items: uniqueRows })
        } else if (base === '/companies') {
          await API.importCompanies({ items: uniqueRows })
        } else if (base === '/advisors') {
          await API.importAdvisors({ items: uniqueRows })
        } else if (base === '/investors') {
          await API.importInvestors({ items: uniqueRows })
        }
      }

      const msg = uniqueRows.length > 0
        ? `Success ${uniqueRows.length} rows added`
        : 'Success 0 rows added (duplicates skipped)'
      setStatus(msg)
      try { window.dispatchEvent(new CustomEvent('crm:imported', { detail: { rows: uniqueRows.length, message: msg } })) } catch {}
      setTimeout(()=>setStatus(null), 6000)
    } catch (e:any) {
      const m = `Error: ${e?.message || 'Import failed'}`
      try { window.dispatchEvent(new CustomEvent('crm:import-error', { detail: { message: m } })) } catch {}
      setStatus(m)
    }
  }

  return (
    <>
    <div className="glass rounded-2xl px-4 py-3 flex items-center justify-between">
      <div className="font-semibold">CRM Lite</div>
      {!isAuthPage && (
        <div className="flex gap-2 items-center">
          {tabs.map(t => (
            <Link key={t.to}
              className={`px-3 py-1 rounded-xl ${pathname===t.to?'bg-white/20':'hover:bg-white/10'}`}
              to={t.to}
            >{t.label}</Link>
          ))}
          {user?.role==='admin' && (
            <Link className={`px-3 py-1 rounded-xl ${pathname==='/admin/users'?'bg-white/20':'hover:bg-white/10'}`} to="/admin/users">Users</Link>
          )}
          {/* Global Import/Export minimal buttons */}
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e)=>{ const f = e.target.files?.[0]; if (f) { handleImport(f); e.currentTarget.value=''; } }} />
          <button className="glass px-2 py-1 rounded-lg hover:bg-white/10 text-sm" onClick={()=>fileRef.current?.click()}>Import</button>
          <button className="glass px-2 py-1 rounded-lg hover:bg-white/10 text-sm" onClick={()=>setExportOpen(true)}>Export</button>
        </div>
      )}
      <div className="flex items-center gap-2 ml-4 md:ml-8">
        {!user ? (
          isAuthPage ? null : (
            <>
              <Link to="/login" className="glass px-3 py-1 rounded-xl hover:bg-white/10">Sign in</Link>
              <Link to="/register" className="glass px-3 py-1 rounded-xl hover:bg-white/10">Sign up</Link>
            </>
          )
        ) : (
          <>
            <Link to="/account" className="opacity-90">{user.email} ({user.role})</Link>
            <button onClick={logout} className="glass px-3 py-1 rounded-xl hover:bg-white/10">Sign out</button>
          </>
        )}
      </div>
    </div>
    {/* header status & export panel */}
    {status && (
      <div
        className={`mt-2 ml-auto max-w-sm rounded-xl text-sm px-3 py-1.5 text-white font-semibold shadow-lg border backdrop-blur-md ${/^Success /i.test(status)?'bg-emerald-600/85 border-white/20':'bg-red-600/85 border-white/20'}`}
        style={{ transform: 'scale(var(--ui-scale, 1))', transformOrigin: 'top right' }}
      >
        {status}
      </div>
    )}
    {exportOpen && (
      <div className="mt-2 glass rounded-2xl p-3 border border-black/20 flex items-center gap-3">
        <div className="opacity-80">Export format:</div>
        <button className="glass px-3 py-1 rounded-xl hover:bg-white/10" onClick={async()=>{
          let rows: any[] = []
          if (pathname.startsWith('/pipeline')) { const xs = await API.getPipeline(); rows = xs.map(d=>({ id:d.id, owner_id:d.owner_id, ...d.data })) }
          else if (pathname.startsWith('/companies')) { const xs = await API.getCompanies(); rows = xs.map(d=>({ id:d.id, owner_id:d.owner_id, ...d.data })) }
          else if (pathname.startsWith('/advisors')) { const xs = await API.getAdvisors(); rows = xs.map(d=>({ id:d.id, owner_id:d.owner_id, ...d.data })) }
          else if (pathname.startsWith('/investors')) { const xs = await API.getInvestors(); rows = xs.map(d=>({ id:d.id, owner_id:d.owner_id, ...d.data })) }
          else if (pathname.startsWith('/admin/users')) {
            const xs = await apiFetch<any[]>('/users?export=true')
            const audit = await apiFetch<any[]>('/users/audit-summary')
            const map:any = {}; audit.forEach(a=>{ map[a.user_id] = a })
            rows = xs.map(u=>({
              Email: u.email,
              Name: u.name,
              Role: u.role,
              Verified: u.verified,
              Created: u.created_at,
              'Last login': u.last_login,
              'Last import': map[u.id]?.last_import ?? '',
              'Last update': map[u.id]?.last_update ?? '',
              'Last delete': map[u.id]?.last_delete ?? '',
              'Last export': map[u.id]?.last_export ?? '',
              'Last password change': map[u.id]?.last_password_change ?? ''
            }))
          }
          exportToCSV(rows, 'export')
          setExportOpen(false)
        }}>CSV</button>
        <button className="glass px-3 py-1 rounded-xl hover:bg-white/10" onClick={async()=>{
          let rows: any[] = []
          if (pathname.startsWith('/pipeline')) { const xs = await API.getPipeline(); rows = xs.map(d=>({ id:d.id, owner_id:d.owner_id, ...d.data })) }
          else if (pathname.startsWith('/companies')) { const xs = await API.getCompanies(); rows = xs.map(d=>({ id:d.id, owner_id:d.owner_id, ...d.data })) }
          else if (pathname.startsWith('/advisors')) { const xs = await API.getAdvisors(); rows = xs.map(d=>({ id:d.id, owner_id:d.owner_id, ...d.data })) }
          else if (pathname.startsWith('/investors')) { const xs = await API.getInvestors(); rows = xs.map(d=>({ id:d.id, owner_id:d.owner_id, ...d.data })) }
          else if (pathname.startsWith('/admin/users')) {
            const xs = await apiFetch<any[]>('/users?export=true')
            const audit = await apiFetch<any[]>('/users/audit-summary')
            const map:any = {}; audit.forEach(a=>{ map[a.user_id] = a })
            rows = xs.map(u=>({
              Email: u.email,
              Name: u.name,
              Role: u.role,
              Verified: u.verified,
              Created: u.created_at,
              'Last login': u.last_login,
              'Last import': map[u.id]?.last_import ?? '',
              'Last update': map[u.id]?.last_update ?? '',
              'Last delete': map[u.id]?.last_delete ?? '',
              'Last export': map[u.id]?.last_export ?? '',
              'Last password change': map[u.id]?.last_password_change ?? ''
            }))
          }
          exportToXLSX(rows, 'export')
          setExportOpen(false)
        }}>XLSX</button>
        <button className="ml-auto glass px-3 py-1 rounded-xl hover:bg-white/10" onClick={()=>setExportOpen(false)}>Close</button>
      </div>
    )}
    </>
  )
}
