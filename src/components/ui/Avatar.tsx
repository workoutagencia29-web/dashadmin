import { cn, initials } from '../../lib/utils'

const PALETTE = [
  'bg-chart-blue/15 text-chart-blue',
  'bg-chart-violet/15 text-chart-violet',
  'bg-chart-emerald/15 text-chart-emerald',
  'bg-chart-orange/15 text-chart-orange',
  'bg-chart-rose/15 text-chart-rose',
  'bg-chart-indigo/15 text-chart-indigo',
  'bg-chart-teal/15 text-chart-teal',
]

function colorFor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return PALETTE[h % PALETTE.length]
}

export function Avatar({
  name,
  size = 'md',
  className,
}: {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const sizes = {
    sm: 'h-8 w-8 text-[11px]',
    md: 'h-10 w-10 text-xs',
    lg: 'h-12 w-12 text-sm',
  }
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-bold',
        sizes[size],
        colorFor(name),
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}
