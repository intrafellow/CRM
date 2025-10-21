export default function Forbidden() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="relative w-full max-w-2xl">
        <div className="absolute inset-0 blur-2xl opacity-40 bg-gradient-to-r from-rose-400 via-amber-400 to-pink-500 rounded-[32px]" />
        <div className="relative glass rounded-[32px] p-8 border border-white/30 shadow-2xl text-slate-900">
          <div className="flex items-center gap-4">
            <div className="text-6xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-rose-500 to-pink-500">403</div>
            <div className="ml-2">
              <div className="text-lg font-semibold">Access denied</div>
              <div className="text-sm opacity-80">You don’t have permission to view this page.</div>
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            <a href="/" className="glass px-4 py-2 rounded-2xl inline-flex items-center gap-2 hover:bg-white/10 w-max">
              <span>←</span>
              <span>Back to dashboard</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}








