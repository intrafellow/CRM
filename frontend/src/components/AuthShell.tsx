import { motion } from 'framer-motion'
export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[80vh] grid place-items-center relative">
      <motion.div
        className="absolute -top-24 left-8 w-64 h-64 rounded-full"
        style={{ background:'radial-gradient(circle at 30% 30%, rgba(139,92,246,.35), transparent 60%)' }}
        animate={{ y:[0,10,0], x:[0,-6,0] }} transition={{ duration:9, repeat:Infinity }}
      />
      <motion.div
        className="absolute -bottom-24 right-8 w-72 h-72 rounded-full"
        style={{ background:'radial-gradient(circle at 70% 60%, rgba(34,211,238,.30), transparent 60%)' }}
        animate={{ y:[0,-12,0], x:[0,6,0] }} transition={{ duration:11, repeat:Infinity }}
      />
      {children}
    </div>
  )
}
