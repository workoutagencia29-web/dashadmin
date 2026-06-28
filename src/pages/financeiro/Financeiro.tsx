import { useMemo, useState } from 'react'
import { Wallet, Banknote, Send, ShieldCheck } from 'lucide-react'
import {
  PageHeader,
  KpiCard,
  SectionCard,
  DataTable,
  StatusBadge,
  Avatar,
  DateRangeFilter,
  type Column,
} from '../../components/ui'
import { BarsChart, DonutChart } from '../../components/charts/Charts'
import {
  platformBalances,
  cashflow14d,
  revenueByMethod,
  repasses,
  type Repasse,
} from '../../data/financeiroData'
import { formatCurrency } from '../../lib/utils'
import { formatDateTime, type RangePreset, type DateRange } from '../../lib/date'

const receitaTotal = revenueByMethod.reduce((s, m) => s + m.value, 0)

export default function Financeiro() {
  const [preset, setPreset] = useState<RangePreset>('last30')
  const [customRange, setCustomRange] = useState<DateRange | null>(null)

  function handleChange(next: RangePreset, custom?: DateRange) {
    setPreset(next)
    if (next === 'custom' && custom) setCustomRange(custom)
  }

  const cashflowData = useMemo(
    () =>
      cashflow14d.map((p) => ({
        label: p.label,
        Entradas: p.entradas,
        Saídas: p.saidas,
      })),
    [],
  )

  const repasseColumns: Column<Repasse>[] = [
    {
      header: 'Seller',
      cell: (r) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={r.sellerName} size="sm" />
          <span className="truncate font-medium text-foreground">{r.sellerName}</span>
        </div>
      ),
    },
    { header: 'Método', cell: (r) => <span className="text-muted">{r.metodo}</span>, nowrap: true },
    {
      header: 'Data',
      cell: (r) => <span className="text-muted">{formatDateTime(r.date)}</span>,
      nowrap: true,
    },
    {
      header: 'Valor',
      align: 'right',
      cell: (r) => <span className="font-semibold text-foreground">{formatCurrency(r.valor)}</span>,
      nowrap: true,
    },
    { header: 'Status', cell: (r) => <StatusBadge status={r.status} />, nowrap: true },
  ]

  return (
    <>
      <PageHeader
        title="Visão da Plataforma"
        subtitle="Saldo, fluxo de caixa e repasses do gateway"
        actions={<DateRangeFilter preset={preset} customRange={customRange} onChange={handleChange} />}
      />

      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Saldo operacional"
            value={formatCurrency(platformBalances.saldoOperacional)}
            delta={3.4}
            icon={Wallet}
            hint="Disponível para liquidação"
          />
          <KpiCard
            label="Receita de taxas (mês)"
            value={formatCurrency(platformBalances.receitaTaxasMes)}
            delta={6.1}
            icon={Banknote}
            hint="MDR + tarifas"
          />
          <KpiCard
            label="Repasses pendentes"
            value={formatCurrency(platformBalances.repassesPendentes)}
            delta={-2.2}
            invertDelta
            icon={Send}
            hint="A liquidar aos sellers"
          />
          <KpiCard
            label="Reserva total"
            value={formatCurrency(platformBalances.reservaTotal)}
            delta={1.5}
            icon={ShieldCheck}
            hint="Retido por risco"
          />
        </div>

        {/* Fluxo de caixa + composição */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <SectionCard title="Fluxo de caixa" description="Entradas vs. saídas — últimos 14 dias">
            <BarsChart
              data={cashflowData}
              height={300}
              series={[
                { key: 'Entradas', name: 'Entradas', color: '#2dd4bf' },
                { key: 'Saídas', name: 'Saídas', color: '#f43f5e' },
              ]}
              valueFormatter={(v) => formatCurrency(v)}
            />
          </SectionCard>

          <SectionCard title="Receita por método" description="Composição do MDR no período">
            <DonutChart data={revenueByMethod} height={200} valueFormatter={formatCurrency} />
            <div className="mt-4 space-y-3">
              {revenueByMethod.map((m) => (
                <div key={m.label} className="flex items-center gap-3 text-sm">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: m.color }} />
                  <span className="flex-1 text-foreground">{m.label}</span>
                  <span className="text-muted">{formatCurrency(m.value)}</span>
                  <span className="w-12 text-right font-semibold text-foreground">
                    {Math.round((m.value / receitaTotal) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Repasses recentes */}
        <SectionCard title="Repasses recentes" description="Liquidações enviadas aos sellers">
          <DataTable
            columns={repasseColumns}
            rows={repasses}
            keyField={(r) => r.id}
            minWidth={720}
            emptyLabel="Nenhum repasse no período."
          />
        </SectionCard>
      </div>
    </>
  )
}
