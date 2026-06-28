import { useState } from 'react'
import {
  Landmark,
  Banknote,
  Wallet,
  Gauge,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import {
  PageHeader,
  KpiCard,
  SectionCard,
  DateRangeFilter,
  ExportButtons,
  downloadCsv,
} from '../../components/ui'
import { Waterfall, DonutChart, LineTrend } from '../../components/charts/Charts'
import {
  dreRows,
  dre,
  dreWaterfall,
  dreComposicao,
  margemTrend,
  dreAV,
  dreAH,
  type DreRow,
} from '../../data/dreData'
import { formatCurrency, formatPercent, formatDelta, cn } from '../../lib/utils'
import type { RangePreset, DateRange } from '../../lib/date'

/* ------------------------------ helpers ------------------------------ */

/** Valor monetário com parênteses para negativos (padrão DRE). */
function money(v: number): string {
  return v < 0 ? `(${formatCurrency(Math.abs(v))})` : formatCurrency(v)
}

function DreRowView({ r }: { r: DreRow }) {
  const av = dreAV(r.value)
  const ahPct = dreAH(r.value, r.prev)
  const isResultRow = r.kind === 'subtotal' || r.kind === 'total'

  const rowClass = cn(
    'border-b border-border/50',
    r.kind === 'group' && 'border-t border-border',
    r.kind === 'subtotal' && 'bg-card-muted/30',
    r.kind === 'total' && 'border-b-0 border-t-2 border-primary/40 bg-primary/10',
  )

  const labelClass = cn(
    r.indent ? 'pl-6 font-normal text-muted' : 'font-semibold text-foreground',
    r.kind === 'subtotal' && 'font-bold text-foreground',
    r.kind === 'total' && 'text-[15px] font-extrabold text-foreground',
  )

  // cor do valor: negativo = danger; resultado positivo = success; demais = foreground
  const valueColor =
    r.value < 0
      ? 'text-danger'
      : isResultRow && r.result
        ? 'text-success'
        : r.indent
          ? 'text-muted'
          : 'text-foreground'

  const valueClass = cn(
    'tabular-nums',
    valueColor,
    r.kind === 'total' ? 'text-[15px] font-extrabold' : isResultRow ? 'font-bold' : 'font-medium',
  )

  const ahTone = isResultRow ? (ahPct >= 0 ? 'text-success' : 'text-danger') : 'text-faint'

  return (
    <tr className={rowClass}>
      <td className={cn('py-2.5 pr-3 text-left', labelClass)}>{r.label}</td>
      <td className={cn('py-2.5 px-3 text-right', valueClass)}>{money(r.value)}</td>
      <td className="whitespace-nowrap py-2.5 px-3 text-right tabular-nums text-muted">
        {formatPercent(av, 1)}
      </td>
      <td className={cn('whitespace-nowrap py-2.5 pl-3 text-right text-xs font-semibold tabular-nums', ahTone)}>
        <span className="inline-flex items-center gap-0.5">
          {ahPct >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {formatDelta(ahPct)}
        </span>
      </td>
    </tr>
  )
}

/* -------------------------------- page -------------------------------- */

export default function Consolidacao() {
  const [preset, setPreset] = useState<RangePreset>('thisMonth')
  const [customRange, setCustomRange] = useState<DateRange | null>(null)

  function handleChange(next: RangePreset, custom?: DateRange) {
    setPreset(next)
    if (next === 'custom' && custom) setCustomRange(custom)
  }

  function exportCsv() {
    downloadCsv(
      'dre.csv',
      ['Conta', 'Valor (R$)', 'AV %', 'AH %'],
      dreRows.map((r) => [r.label, r.value, dreAV(r.value).toFixed(1), dreAH(r.value, r.prev).toFixed(1)]),
    )
  }

  return (
    <>
      <PageHeader
        title="Consolidação Financeira — DRE"
        subtitle={`Demonstração do Resultado do Exercício · gerencial · ${dre.periodo}`}
        actions={
          <>
            <DateRangeFilter preset={preset} customRange={customRange} onChange={handleChange} />
            <ExportButtons formats={['CSV', 'PDF']} onCsv={exportCsv} />
          </>
        }
      />

      <div className="space-y-6">
        {/* Indicadores-chave */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <KpiCard
            label="Receita bruta"
            value={formatCurrency(dre.receitaBruta)}
            delta={dre.deltaReceitaBruta}
            icon={Landmark}
            hint="Receita operacional bruta"
          />
          <KpiCard
            label="Receita líquida"
            value={formatCurrency(dre.receitaLiquida)}
            delta={dre.deltaReceitaLiquida}
            icon={Banknote}
            hint="Após deduções"
          />
          <KpiCard
            label="Lucro bruto"
            value={formatCurrency(dre.lucroBruto)}
            delta={dre.deltaLucroBruto}
            icon={Wallet}
            hint={`Margem bruta ${formatPercent(dre.margemBruta, 1)}`}
          />
          <KpiCard
            label="EBITDA"
            value={formatCurrency(dre.ebitda)}
            delta={dre.deltaEbitda}
            icon={Gauge}
            hint={`Margem EBITDA ${formatPercent(dre.margemEbitda, 1)}`}
          />
          <KpiCard
            label="Lucro líquido"
            value={formatCurrency(dre.lucroLiquido)}
            delta={dre.deltaLucroLiquido}
            icon={TrendingUp}
            hint={`Margem líquida ${formatPercent(dre.margemLiquida, 1)}`}
          />
        </div>

        {/* Demonstração estruturada */}
        <SectionCard
          title="Demonstração do Resultado (DRE)"
          description="Da receita bruta ao lucro líquido · AV% sobre a receita bruta · AH% vs. período anterior"
        >
          <div className="scrollbar-thin overflow-x-auto">
            <table className="w-full min-w-[620px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                  <th className="py-2.5 pr-3 text-left font-semibold">Conta</th>
                  <th className="py-2.5 px-3 text-right font-semibold">Valor</th>
                  <th className="py-2.5 px-3 text-right font-semibold">AV%</th>
                  <th className="py-2.5 pl-3 text-right font-semibold">vs ant.</th>
                </tr>
              </thead>
              <tbody>
                {dreRows.map((r, i) => (
                  <DreRowView key={i} r={r} />
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Cascata + composição */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
          <SectionCard
            title="Cascata do resultado"
            description="Como a receita bruta se transforma em lucro líquido"
          >
            <Waterfall steps={dreWaterfall} height={320} valueFormatter={formatCurrency} />
          </SectionCard>

          <SectionCard title="Composição da receita bruta" description="Participação por fonte">
            <DonutChart data={dreComposicao} height={200} valueFormatter={formatCurrency} />
            <div className="mt-4 space-y-3">
              {dreComposicao.map((c) => {
                const total = dreComposicao.reduce((s, x) => s + x.value, 0)
                return (
                  <div key={c.label} className="flex items-center gap-2.5 text-sm">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.color }} />
                    <span className="min-w-0 flex-1 truncate text-foreground">{c.label}</span>
                    <span className="whitespace-nowrap text-xs tabular-nums text-muted">{formatCurrency(c.value)}</span>
                    <span className="w-9 shrink-0 text-right font-semibold tabular-nums text-foreground">
                      {Math.round((c.value / total) * 100)}%
                    </span>
                  </div>
                )
              })}
            </div>
          </SectionCard>
        </div>

        {/* Evolução das margens */}
        <SectionCard title="Evolução das margens" description="Últimos 6 meses (% sobre receita líquida)">
          <LineTrend
            data={margemTrend}
            height={260}
            series={[
              { key: 'Bruta', name: 'Margem bruta', color: '#2f6bff' },
              { key: 'EBITDA', name: 'Margem EBITDA', color: '#8b5cf6' },
              { key: 'Líquida', name: 'Margem líquida', color: '#10b981' },
            ]}
            valueFormatter={(v) => formatPercent(v, 1)}
          />
        </SectionCard>
      </div>
    </>
  )
}
