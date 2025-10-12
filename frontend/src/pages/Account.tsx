import LiquidCard from '../components/LiquidCard'
import { useAuth } from '../auth/AuthContext'

export default function Account() {
  const { user } = useAuth()
  if (!user) return null
  return (
    <div className="p-4 grid gap-4">
      <LiquidCard>
        <div className="text-xl mb-2">Аккаунт</div>
        <div>E-mail: <b>{user.email}</b></div>
        <div>Роль: <b>{user.role}</b></div>
        <div>ID: <code>{user.id}</code></div>
      </LiquidCard>
    </div>
  )
}
