export default function GlassCard({ title, subtitle, children }:{
  title: string; subtitle?: string; children: React.ReactNode
}) {
  return (
    <div className="auth-card glass rounded-3xl p-6 md:p-7">
      <div className="mb-5">
        <div className="card-title">{title}</div>
        {subtitle && <div className="card-sub mt-1">{subtitle}</div>}
      </div>
      {children}
    </div>
  )
}
