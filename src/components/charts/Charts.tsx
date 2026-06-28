import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  type TooltipProps,
} from 'recharts'
import { cn, formatCompact } from '../../lib/utils'

/** Tamanho do valor central do donut conforme o comprimento (cabe valores completos). */
function donutCenterSize(value: string): string {
  const len = value.length
  if (len > 15) return 'text-sm'
  if (len > 11) return 'text-base'
  if (len > 8) return 'text-lg'
  return 'text-2xl'
}

/* ----------------------------- Tooltip ------------------------------- */

function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: TooltipProps<number, string> & { formatter?: (v: number) => string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-xl shadow-black/20">
      {label !== undefined && <p className="mb-1 text-xs font-semibold text-foreground">{label}</p>}
      <div className="space-y-1">
        {payload.map((p, i) => {
          // p.color pode vir vazio em gráficos de pizza — usa a cor do próprio dado.
          const dot = p.color || (p.payload && (p.payload.color || p.payload.fill)) || 'currentColor'
          return (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: dot }} />
              <span className="text-muted">{p.name}</span>
              <span className="ml-auto pl-3 font-semibold text-foreground">
                {formatter ? formatter(Number(p.value)) : Number(p.value).toLocaleString('pt-BR')}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* --------------------------- Area / Trend ---------------------------- */

export interface SeriesDef {
  key: string
  name: string
  color: string
}

export function AreaTrend({
  data,
  series,
  height = 260,
  yFormatter,
  valueFormatter,
}: {
  data: Array<Record<string, number | string>>
  series: SeriesDef[]
  height?: number
  yFormatter?: (v: number) => string
  valueFormatter?: (v: number) => string
}) {
  return (
    <div className="chart-themed w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.28} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tickMargin={12}
            fontSize={12}
            minTickGap={24}
            interval="preserveStartEnd"
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tickMargin={8}
            fontSize={12}
            width={48}
            tickFormatter={yFormatter ?? formatCompact}
          />
          <Tooltip content={<ChartTooltip formatter={valueFormatter} />} />
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2.5}
              fill={`url(#grad-${s.key})`}
              dot={false}
              isAnimationActive={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ------------------------------ Lines -------------------------------- */

export function LineTrend({
  data,
  series,
  height = 260,
  valueFormatter,
}: {
  data: Array<Record<string, number | string>>
  series: SeriesDef[]
  height?: number
  valueFormatter?: (v: number) => string
}) {
  return (
    <div className="chart-themed w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tickMargin={12} fontSize={12} minTickGap={24} interval="preserveStartEnd" />
          <YAxis axisLine={false} tickLine={false} tickMargin={8} fontSize={12} width={48} tickFormatter={formatCompact} />
          <Tooltip content={<ChartTooltip formatter={valueFormatter} />} />
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ------------------------------- Bars -------------------------------- */

export function BarsChart({
  data,
  series,
  height = 260,
  valueFormatter,
  stacked = false,
}: {
  data: Array<Record<string, number | string>>
  series: SeriesDef[]
  height?: number
  valueFormatter?: (v: number) => string
  stacked?: boolean
}) {
  return (
    <div className="chart-themed w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 8, left: -8, bottom: 0 }} barCategoryGap="28%">
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tickMargin={12} fontSize={12} minTickGap={8} interval="preserveStartEnd" />
          <YAxis axisLine={false} tickLine={false} tickMargin={8} fontSize={12} width={48} tickFormatter={formatCompact} />
          <Tooltip cursor={{ fill: 'rgb(148 163 184 / 0.08)' }} content={<ChartTooltip formatter={valueFormatter} />} />
          {series.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.name}
              fill={s.color}
              stackId={stacked ? 'a' : undefined}
              radius={stacked ? (i === series.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]) : [6, 6, 0, 0]}
              isAnimationActive={false}
              maxBarSize={42}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ------------------------------ Donut -------------------------------- */

export interface DonutSegment {
  label: string
  value: number
  color: string
}

export function DonutChart({
  data,
  height = 220,
  centerLabel,
  centerValue,
  valueFormatter,
}: {
  data: DonutSegment[]
  height?: number
  centerLabel?: string
  centerValue?: string
  /** Formata o valor exibido no tooltip ao passar o mouse (ex: formatCurrency). */
  valueFormatter?: (v: number) => string
}) {
  return (
    <div className="relative w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            innerRadius="62%"
            outerRadius="92%"
            paddingAngle={2}
            stroke="none"
            isAnimationActive={false}
          >
            {data.map((d) => (
              <Cell key={d.label} fill={d.color} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip formatter={valueFormatter} />} />
        </PieChart>
      </ResponsiveContainer>
      {(centerLabel || centerValue) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          {centerValue && (
            <span className={cn('font-bold leading-tight tracking-tight tabular-nums text-foreground', donutCenterSize(centerValue))}>
              {centerValue}
            </span>
          )}
          {centerLabel && <span className="mt-0.5 text-xs text-muted">{centerLabel}</span>}
        </div>
      )}
    </div>
  )
}

/* -------------------- Waterfall / Cascata (DRE) ---------------------- */

export interface WaterfallStep {
  label: string
  /** Variação no resultado acumulado (+ receita, − custo/despesa). */
  delta: number
  /** Barra de total/subtotal — desenhada a partir do zero. */
  total?: boolean
}

function WaterfallTooltip({
  active,
  payload,
  formatter,
}: TooltipProps<number, string> & { formatter: (v: number) => string }) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload as { label: string; amount: number; end: number } | undefined
  if (!row) return null
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-xl shadow-black/20">
      <p className="mb-1 text-xs font-semibold text-foreground">{row.label}</p>
      <div className="flex items-center gap-4 text-xs">
        <span className="text-muted">Valor</span>
        <span className={cn('ml-auto font-semibold', row.amount >= 0 ? 'text-success' : 'text-danger')}>
          {row.amount >= 0 ? '+ ' : '− '}
          {formatter(Math.abs(row.amount))}
        </span>
      </div>
      <div className="mt-0.5 flex items-center gap-4 text-xs">
        <span className="text-muted">Acumulado</span>
        <span className="ml-auto font-semibold text-foreground">{formatter(row.end)}</span>
      </div>
    </div>
  )
}

export function Waterfall({
  steps,
  height = 300,
  valueFormatter = (v) => v.toLocaleString('pt-BR'),
}: {
  steps: WaterfallStep[]
  height?: number
  valueFormatter?: (v: number) => string
}) {
  let cum = 0
  const rows = steps.map((s) => {
    if (s.total) {
      cum = s.delta
      return { label: s.label, base: 0, value: Math.abs(s.delta), fill: '#2f6bff', amount: s.delta, end: s.delta }
    }
    const start = cum
    const end = cum + s.delta
    cum = end
    return {
      label: s.label,
      base: Math.min(start, end),
      value: Math.abs(s.delta),
      fill: s.delta >= 0 ? '#10b981' : '#f43f5e',
      amount: s.delta,
      end,
    }
  })

  return (
    <div className="chart-themed w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 12, right: 8, left: -2, bottom: 0 }} barCategoryGap="22%">
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tickMargin={10} fontSize={10.5} interval={0} />
          <YAxis axisLine={false} tickLine={false} tickMargin={8} fontSize={12} width={52} tickFormatter={formatCompact} />
          <Tooltip cursor={{ fill: 'rgb(148 163 184 / 0.08)' }} content={<WaterfallTooltip formatter={valueFormatter} />} />
          <Bar dataKey="base" stackId="wf" fill="transparent" isAnimationActive={false} />
          <Bar dataKey="value" stackId="wf" radius={[4, 4, 0, 0]} isAnimationActive={false} maxBarSize={56}>
            {rows.map((r, i) => (
              <Cell key={i} fill={r.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ---------------------------- Sparkline ------------------------------ */

export function Sparkline({
  data,
  color = '#2f6bff',
  height = 40,
}: {
  data: number[]
  color?: string
  height?: number
}) {
  const rows = data.map((v, i) => ({ i, v }))
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
