import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function LiquidTopbar() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const isAuthPage = /^\/(login|register|verify)/.test(pathname)

  const tabs = [
    { to: '/', label: 'Дашборд' },
    { to: '/contacts', label: 'Контакты' },
    { to: '/deals', label: 'Сделки' },
  ]

  return (
    <div className="glass rounded-2xl px-4 py-3 flex items-center justify-between">
      <div className="font-semibold">CRM Lite</div>
      {!isAuthPage && (
        <div className="flex gap-2">
          {tabs.map(t => (
            <Link key={t.to}
              className={`px-3 py-1 rounded-xl ${pathname===t.to?'bg-white/20':'hover:bg-white/10'}`}
              to={t.to}
            >{t.label}</Link>
          ))}
        </div>
      )}
      <div className="flex items-center gap-2">
        {!user ? (
          isAuthPage ? null : (
            <>
              <Link to="/login" className="glass px-3 py-1 rounded-xl hover:bg-white/10">Войти</Link>
              <Link to="/register" className="glass px-3 py-1 rounded-xl hover:bg-white/10">Регистрация</Link>
            </>
          )
        ) : (
          <>
            <Link to="/account" className="opacity-90">{user.email} ({user.role})</Link>
            <button onClick={logout} className="glass px-3 py-1 rounded-xl hover:bg-white/10">Выйти</button>
          </>
        )}
      </div>
    </div>
  )
}
