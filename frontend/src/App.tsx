import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { RequireAuth } from './auth/guards'
import LiquidTopbar from './components/LiquidTopbar'
import Dashboard from './pages/Dashboard'
import Contacts from './pages/Contacts'
import Deals from './pages/Deals'
import Login from './pages/Login'
import Register from './pages/Register'
import Verify from './pages/Verify'
import Account from './pages/Account'
import LiquidCard from './components/LiquidCard'

/**
 * ВАЖНО: Здесь НЕТ BrowserRouter.
 * Он должен быть ОДИН раз — в src/main.tsx вокруг <App />.
 */
export default function App() {
  return (
    <AuthProvider>
      <div className="max-w-6xl mx-auto p-4 grid gap-4">
        <LiquidTopbar />
        <Routes>
          <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/deals" element={<Deals />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/account" element={<RequireAuth><Account /></RequireAuth>} />
          <Route path="*" element={<LiquidCard>404</LiquidCard>} />
        </Routes>
      </div>
    </AuthProvider>
  )
}
