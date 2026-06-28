import { useMemo, useState } from 'react'
import {
  Landmark,
  Wallet,
  ArrowLeftRight,
  CheckCircle2,
  ShieldAlert,
  Store,
  Banknote,
  Receipt,
  AlertTriangle,
  Info,
  ArrowRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader, KpiCard, Card, SectionCard, Button, ProgressBar, Avatar, DateRangeFilter } from '../components/ui'
import { AreaTrend, DonutChart } from '../components/charts/Charts'
import {
  kpis,
  tpv30,
  methodMix,
  approvalFunnel,
  topSellers,
  alerts,
  type Kpi,
} from '../data/dashboardData'
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatCompact,
} from '../lib/utils'
import { presetRange, type RangePreset, type DateRange } from '../lib/date'

const KPI_ICONS: Record<string, typeof Landmark> = {
  tpv: Landmark,
  receita: Banknote,
  transacoes: ArrowLeftRight,
  aprovacao: CheckCircle2,
  chargeback: ShieldAlert,
  sellers: Store,
  saques: Wallet,
  ticket: Receipt,
}

function kpiValue(k: Kpi): string {
  switch (k.format) {
    case 'currency':
      return formatCurrency(k.value)
    case 'currencyCompact':
      return formatCurrency(k.value)
    case 'percent':
      return formatPercent(k.value, k.id === 'chargeback' ? 2 : 1)
    default:
      return formatNumber(k.value)
  }
}

const ALERT_ICON = { danger: AlertTriangle, warning: AlertTriangle, info: Info }
const ALERT_STYLE = {
  danger: 'bg-danger/10 text-danger',
  warning: 'bg-warning/15 text-warning',
  info: 'bg-primary/10 text-primary',
}

export default function Dashboard() {
  const [preset, setPreset] = useState<RangePreset>('last30')
  const [customRange, setCustomRange] = useState<DateRange | null>(null)

  const trendData = useMemo(() => {
    const range = preset === 'custom' && customRange ? customRange : presetRange(preset, tpv30[0].date)
    const from = range.from.getTime()
    const to = range.to.getTime()
    const pts = tpv30.filter((p) => p.date.getTime() >= from && p.date.getTime() <= to)
    return (pts.length ? pts : tpv30).map((p) => ({ label: p.label, TPV: p.tpv, Receita: p.liquido }))
  }, [preset, customRange])

  function handleChange(next: RangePreset, custom?: DateRange) {
    setPreset(next)
    if (next === 'custom' && custom) setCustomRange(custom)
  }

  return (
    <>
      <PageHeader
        title="Visão Geral"
        subtitle="Saúde do gateway em tempo real · 27/06/2026"
        actions={
          <>
            <DateRangeFilter preset={preset} customRange={customRange} onChange={handleChange} />
            <Button>
              <Banknote className="h-4 w-4" /> Relatório
            </Button>
          </>
        }
      />

      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((k) => (
            <KpiCard
              key={k.id}
              label={k.label}
              value={kpiValue(k)}
              delta={k.delta}
              invertDelta={k.invert}
              icon={KPI_ICONS[k.id] ?? Landmark}
              hint={k.hint}
            />
          ))}
        </div>

        {/* Tendência + mix */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <SectionCard title="Volume transacionado (TPV)" description="TPV vs. receita de taxas no período">
            <AreaTrend
              data={trendData}
              height={300}
              series={[
                { key: 'TPV', name: 'TPV', color: '#2f6bff' },
                { key: 'Receita', name: 'Receita', color: '#8b5cf6' },
              ]}
              yFormatter={(v) => formatCompact(v)}
              valueFormatter={(v) => formatCurrency(v)}
            />
          </SectionCard>

          <SectionCard title="Mix por método" description="Participação no volume">
            <DonutChart
              data={methodMix.map((m) => ({ label: m.label, value: m.value, color: m.color }))}
              height={200}
              valueFormatter={(v) => formatPercent(v, 0)}
            />
            <div className="mt-4 space-y-3">
              {methodMix.map((m) => (
                <div key={m.label} className="flex items-center gap-2.5 text-sm">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: m.color }} />
                  <span className="min-w-0 flex-1 truncate text-foreground">{m.label}</span>
                  <span className="whitespace-nowrap text-xs tabular-nums text-muted">{formatCurrency(m.amount)}</span>
                  <span className="w-9 shrink-0 text-right font-semibold tabular-nums text-foreground">{m.value}%</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Funil + top sellers + alertas */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          {/* Funil de aprovação */}
          <SectionCard title="Funil de aprovação" description="Últimos 30 dias">
            <div className="space-y-4">
              {approvalFunnel.map((s, i) => (
                <div key={s.label}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{s.label}</span>
                    <span className="text-muted">
                      {formatNumber(s.value)} · <span className="font-semibold text-foreground">{formatPercent(s.pct)}</span>
                    </span>
                  </div>
                  <ProgressBar value={s.pct} tone={i === 0 ? 'primary' : i < 3 ? 'primary' : 'success'} />
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-2xl bg-card-muted/40 px-4 py-3 text-sm">
              <span className="text-muted">Perda autorização→liquidação: </span>
              <span className="font-semibold text-danger">2,7%</span>
            </div>
          </SectionCard>

          {/* Top sellers */}
          <SectionCard
            title="Top sellers"
            description="Por volume (30d)"
            action={
              <Link to="/sellers" className="text-sm font-medium text-primary hover:underline">
                Ver todos
              </Link>
            }
          >
            <div className="space-y-1">
              {topSellers.map((s, i) => (
                <Link
                  key={s.id}
                  to={`/sellers/${s.id}`}
                  className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-card-muted/50"
                >
                  <span className="w-4 text-center text-xs font-bold text-faint">{i + 1}</span>
                  <Avatar name={s.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{s.name}</p>
                    <p className="text-xs text-muted">{s.segment}</p>
                  </div>
                  <div className="text-right">
                    <p className="whitespace-nowrap text-sm font-semibold tabular-nums text-foreground">{formatCurrency(s.volume30d)}</p>
                    <p className="text-xs text-success">{formatPercent(s.approvalRate)} aprov.</p>
                  </div>
                </Link>
              ))}
            </div>
          </SectionCard>

          {/* Alertas */}
          <SectionCard
            title="Alertas & risco"
            description="Eventos que pedem atenção"
            action={
              <Link to="/risco/antifraude" className="text-sm font-medium text-primary hover:underline">
                Central
              </Link>
            }
          >
            <div className="space-y-3">
              {alerts.map((a) => {
                const Icon = ALERT_ICON[a.tone]
                return (
                  <div key={a.id} className="flex gap-3 rounded-2xl border border-border bg-card-muted/30 p-3">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${ALERT_STYLE[a.tone]}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{a.title}</p>
                      <p className="mt-0.5 text-xs text-muted">{a.description}</p>
                      <p className="mt-1 text-[11px] text-faint">{a.ago}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </SectionCard>
        </div>

        {/* CTA rodapé */}
        <Card className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <h3 className="text-base font-bold text-foreground">Fila operacional</h3>
            <p className="mt-1 text-sm text-muted">
              4 KYCs, 12 saques e 3 disputas MED aguardam ação da equipe.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link to="/sellers/kyc">
              <Button variant="outline">
                Analisar KYC <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/financeiro/saques">
              <Button>
                Aprovar saques <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </>
  )
}
