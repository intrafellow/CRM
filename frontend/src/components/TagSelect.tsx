import { Tag } from '../domain/enums'

type Props = { value: Tag[]; onChange: (v: Tag[]) => void }
export default function TagSelect({ value, onChange }: Props) {
  const all = Object.values(Tag)
  function toggle(t: Tag) {
    onChange(value.includes(t) ? value.filter(x => x !== t) : [...value, t])
  }
  return (
    <div className="flex gap-2 flex-wrap">
      {all.map(t => (
        <button key={t} onClick={() => toggle(t)}
          className={`px-3 py-1 rounded-xl border ${value.includes(t) ? 'bg-white/20' : 'bg-white/5 hover:bg-white/10'} border-white/20`}>
          {t}
        </button>
      ))}
    </div>
  )
}
