/* Date helpers + period presets for charts/filters. */

export interface DateRange {
  from: Date
  to: Date
}

export type RangePreset =
  | 'today'
  | 'yesterday'
  | 'last7'
  | 'last15'
  | 'last30'
  | 'thisMonth'
  | 'all'
  | 'custom'

export const PRESET_LABELS: Record<RangePreset, string> = {
  today: 'Hoje',
  yesterday: 'Ontem',
  last7: 'Últimos 7 dias',
  last15: 'Últimos 15 dias',
  last30: 'Últimos 30 dias',
  thisMonth: 'Este mês',
  all: 'Todo período',
  custom: 'Período personalizado',
}

/** Presets rendered by hour (00h–23h) instead of by day. */
export function isHourly(preset: RangePreset): boolean {
  return preset === 'today' || preset === 'yesterday'
}

export function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function endOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export function startOfMonth(d: Date): Date {
  const x = new Date(d)
  x.setDate(1)
  x.setHours(0, 0, 0, 0)
  return x
}

const pad = (n: number) => String(n).padStart(2, '0')

/** "dd/MM" */
export function formatDayMonth(d: Date): string {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`
}

/** "00h" */
export function formatHour(d: Date): string {
  return `${pad(d.getHours())}h`
}

/** "dd/MM/yy" */
export function formatShort(d: Date): string {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${String(d.getFullYear()).slice(2)}`
}

/** "dd/MM/yyyy HH:mm" */
export function formatDateTime(d: Date): string {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`
}

/** "há 5 min" / "há 2 h" / "há 3 d" */
export function timeAgo(d: Date): string {
  const diff = Date.now() - d.getTime()
  const min = Math.round(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `há ${h} h`
  const days = Math.round(h / 24)
  return `há ${days} d`
}

/** Resolve a preset into an absolute [from, to] range relative to now. */
export function presetRange(preset: RangePreset, dataStart: Date): DateRange {
  const now = new Date()
  const today = startOfDay(now)
  switch (preset) {
    case 'today':
      return { from: today, to: now }
    case 'yesterday': {
      const y = addDays(today, -1)
      return { from: y, to: endOfDay(y) }
    }
    case 'last7':
      return { from: addDays(today, -6), to: now }
    case 'last15':
      return { from: addDays(today, -14), to: now }
    case 'last30':
      return { from: addDays(today, -29), to: now }
    case 'thisMonth':
      return { from: startOfMonth(today), to: now }
    case 'all':
      return { from: dataStart, to: now }
    case 'custom':
      return { from: today, to: now }
  }
}

/** Hash determinístico 0..1 (sem Math.random, pra render estável entre reloads). */
export function seeded(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}
