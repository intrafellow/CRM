import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { RequireAuth } from './auth/guards'
import LiquidTopbar from './components/LiquidTopbar'
import Dashboard from './pages/Dashboard'
import Pipeline from './pages/Pipeline'
import Companies from './pages/Companies'
import Advisors from './pages/Advisors'
import Investors from './pages/Investors'
import AdminUsers from './pages/AdminUsers'
import Login from './pages/Login'
import Register from './pages/Register'
import Verify from './pages/Verify'
import Account from './pages/Account'
import LiquidCard from './components/LiquidCard'
import NotFound from './pages/NotFound'

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
          <Route path="/pipeline" element={<RequireAuth><Pipeline /></RequireAuth>} />
          <Route path="/companies" element={<RequireAuth><Companies /></RequireAuth>} />
          <Route path="/advisors" element={<RequireAuth><Advisors /></RequireAuth>} />
          <Route path="/investors" element={<RequireAuth><Investors /></RequireAuth>} />
          <Route path="/admin/users" element={<RequireAuth><AdminUsers /></RequireAuth>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/account" element={<RequireAuth><Account /></RequireAuth>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </AuthProvider>
  )
}
