type Props = { value: string; onChange: (v: string) => void; placeholder?: string }
export default function SearchBar({ value, onChange, placeholder }: Props) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder ?? 'Поиск...'}
      className="w-full md:w-80 glass px-4 py-2 rounded-2xl outline-none text-slate-900 placeholder-black/40"
    />
  )
}
