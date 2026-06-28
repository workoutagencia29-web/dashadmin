import { Search } from 'lucide-react'
import { cn } from '../../lib/utils'

export function SearchInput({
  value,
  onChange,
  placeholder = 'Pesquisar…',
  className,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div className={cn('relative w-full sm:w-72', className)}>
      <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-input/60 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-faint focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </div>
  )
}
