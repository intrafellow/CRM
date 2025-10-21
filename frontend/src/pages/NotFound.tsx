export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="relative w-full max-w-2xl">
        <div className="absolute inset-0 blur-2xl opacity-40 bg-gradient-to-r from-indigo-400 via-sky-400 to-emerald-400 rounded-[32px]" />
        <div className="relative glass rounded-[32px] p-8 border border-white/30 shadow-2xl text-slate-900">
          <div className="flex items-center gap-4">
            <div className="text-6xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-blue-500">404</div>
            <div className="ml-2">
              <div className="text-lg font-semibold">Page not found</div>
              <div className="text-sm opacity-80">The link might be outdated or the page was moved.</div>
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            <a href="/" className="glass px-4 py-2 rounded-2xl inline-flex items-center gap-2 hover:bg-white/10 w-max">
              <span>←</span>
              <span>Back to dashboard</span>
            </a>
            <div className="text-xs opacity-70">Tip: Use the header to navigate Pipeline, Companies to reach, Advisors, Investors.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
