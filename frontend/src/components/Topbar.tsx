import { Link, useLocation } from 'react-router-dom'

export default function Topbar() {
  const { pathname } = useLocation()
  const tabs = [
    { to: '/', label: 'Дашборд' },
    { to: '/contacts', label: 'Контакты' },
    { to: '/deals', label: 'Сделки' }
  ]
  return (
    <div className="sticky top-0 z-20 p-3">
      <div className="glass rounded-2xl px-4 py-2 flex items-center gap-4 text-slate-100">
        <div className="text-lg font-semibold">CRM Lite</div>
        <nav className="flex gap-2">
          {tabs.map(t => (
            <Link
              key={t.to}
              to={t.to}
              className={`px-3 py-1 rounded-xl transition text-slate-100 ${
                pathname === t.to ? 'bg-white/20' : 'hover:bg-white/10'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
