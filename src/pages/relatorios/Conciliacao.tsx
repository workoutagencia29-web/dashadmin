import { useMemo, useState } from 'react'
import { CheckCircle2, AlertTriangle, Clock, Percent, Check } from 'lucide-react'
import {
  PageHeader,
  KpiCard,
  SectionCard,
  SearchInput,
  Select,
  DataTable,
  StatusBadge,
  MethodBadge,
  Drawer,
  DetailRow,
  DrawerSection,
  Toolbar,
  ExportButtons,
  downloadCsv,
  Button,
  DateRangeFilter,
  type Column,
} from '../../components/ui'
import { BarsChart } from '../../components/charts/Charts'
import { useToast } from '../../components/ui/Toast'
import {
  settlementBatches,
  conciliacaoSummary,
  type SettlementBatch,
  type ConciliacaoStatus,
} from '../../data/conciliacaoData'
import { ACQUIRERS } from '../../data/shared'
import { formatCurrency, formatNumber, formatPercent } from '../../lib/utils'
import { formatShort, presetRange, type RangePreset, type DateRange } from '../../lib/date'

const STATUSES: ConciliacaoStatus[] = ['Conciliado', 'Divergente', 'Pendente']

export default function Conciliacao() {
  const { toast } = useToast()
  const [preset, setPreset] = useState<RangePreset>('last30')
  const [customRange, setCustomRange] = useState<DateRange | null>(null)
  const [query, setQuery] = useState('')
  const [acquirer, setAcquirer] = useState('Todos')
  const [status, setStatus] = useState('Todos')
  const [selected, setSelected] = useState<SettlementBatch | null>(null)

  const earliest = useMemo(
    () => settlementBatches.reduce((min, b) => (b.date < min ? b.date : min), settlementBatches[0].date),
    [],
  )

  const filtered = useMemo(() => {
    const range = preset === 'custom' && customRange ? customRange : presetRange(preset, earliest)
    const from = range.from.getTime()
    const to = range.to.getTime()
    const q = query.trim().toLowerCase()
    return settlementBatches.filter((b) => {
      if (b.date.getTime() < from || b.date.getTime() > to) return false
      if (acquirer !== 'Todos' && b.acquirer !== acquirer) return false
      if (status !== 'Todos' && b.status !== status) return false
      if (q && !`${b.id} ${b.acquirer}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [preset, customRange, earliest, query, acquirer, status])

  const byAcquirer = useMemo(() => {
    return ACQUIRERS.map((acq) => {
      const rows = filtered.filter((b) => b.acquirer === acq)
      const conciliado = rows
        .filter((b) => b.status === 'Conciliado')
        .reduce((s, b) => s + b.valorRecebido, 0)
      const divergente = rows
        .filter((b) => b.status === 'Divergente')
        .reduce((s, b) => s + Math.abs(b.divergencia), 0)
      return { label: acq, Conciliado: +conciliado.toFixed(2), Divergente: +divergente.toFixed(2) }
    }).filter((d) => d.Conciliado > 0 || d.Divergente > 0)
  }, [filtered])

  function handleRange(next: RangePreset, custom?: DateRange) {
    setPreset(next)
    if (next === 'custom' && custom) setCustomRange(custom)
  }

  function markConciliated(b: SettlementBatch) {
    toast(`Lote ${b.id} marcado como conciliado`, 'success')
    setSelected(null)
  }

  function exportCsv() {
    downloadCsv(
      'conciliacao.csv',
      ['Lote', 'Adquirente', 'Data', 'Transações', 'Valor bruto', 'Taxas', 'Valor líquido', 'Recebido', 'Divergência', 'Status'],
      filtered.map((b) => [
        b.id,
        b.acquirer,
        formatShort(b.date),
        b.transacoes,
        b.valorBruto,
        b.taxas,
        b.valorLiquido,
        b.valorRecebido,
        b.divergencia,
        b.status,
      ]),
    )
  }

  const columns: Column<SettlementBatch>[] = [
    {
      header: 'Lote',
      cell: (b) => (
        <div className="flex items-center gap-2">
          <span
            className={
              b.status === 'Divergente'
                ? 'h-7 w-1 shrink-0 rounded-full bg-danger'
                : 'h-7 w-1 shrink-0 rounded-full bg-transparent'
            }
          />
          <span className="font-medium text-foreground">{b.id}</span>
        </div>
      ),
      nowrap: true,
    },
    { header: 'Adquirente', cell: (b) => <MethodBadge method={b.acquirer} />, nowrap: true },
    { header: 'Data', cell: (b) => <span className="text-muted">{formatShort(b.date)}</span>, nowrap: true },
    {
      header: 'Transações',
      align: 'right',
      cell: (b) => <span className="text-muted">{formatNumber(b.transacoes)}</span>,
      nowrap: true,
    },
    {
      header: 'Valor bruto',
      align: 'right',
      cell: (b) => <span className="text-foreground">{formatCurrency(b.valorBruto)}</span>,
      nowrap: true,
    },
    {
      header: 'Taxas',
      align: 'right',
      cell: (b) => <span className="text-muted">{formatCurrency(b.taxas)}</span>,
      nowrap: true,
    },
    {
      header: 'Valor líquido',
      align: 'right',
      cell: (b) => <span className="font-semibold text-foreground">{formatCurrency(b.valorLiquido)}</span>,
      nowrap: true,
    },
    {
      header: 'Recebido',
      align: 'right',
      cell: (b) => <span className="text-foreground">{formatCurrency(b.valorRecebido)}</span>,
      nowrap: true,
    },
    {
      header: 'Divergência',
      align: 'right',
      cell: (b) => (
        <span className={b.divergencia !== 0 ? 'font-semibold text-danger' : 'text-muted'}>
          {b.divergencia !== 0 ? formatCurrency(b.divergencia) : '—'}
        </span>
      ),
      nowrap: true,
    },
    { header: 'Status', cell: (b) => <StatusBadge status={b.status} />, nowrap: true },
  ]

  return (
    <>
      <PageHeader
        title="Conciliação"
        subtitle="Reconciliação de liquidações por adquirente"
        actions={
          <>
            <DateRangeFilter preset={preset} customRange={customRange} onChange={handleRange} />
            <ExportButtons formats={['CSV', 'PDF']} onCsv={exportCsv} />
          </>
        }
      />

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Conciliado"
            value={formatCurrency(conciliacaoSummary.conciliadoValor)}
            icon={CheckCircle2}
            hint="Crédito batido com o extrato"
          />
          <KpiCard
            label="Divergências"
            value={formatNumber(conciliacaoSummary.divergencias)}
            icon={AlertTriangle}
            invertDelta
            hint={`${formatCurrency(conciliacaoSummary.divergenciaValor)} em diferenças`}
          />
          <KpiCard
            label="A conciliar"
            value={formatCurrency(conciliacaoSummary.pendenteValor)}
            icon={Clock}
            hint="Lotes pendentes de crédito"
          />
          <KpiCard
            label="Taxa de conciliação"
            value={formatPercent(conciliacaoSummary.taxaConciliacao)}
            icon={Percent}
            hint="Lotes conciliados / total"
          />
        </div>

        <SectionCard>
          <Toolbar
            left={
              <>
                <SearchInput value={query} onChange={setQuery} placeholder="Lote, adquirente…" />
                <Select value={acquirer} onChange={(e) => setAcquirer(e.target.value)} className="w-auto">
                  <option value="Todos">Todos os adquirentes</option>
                  {ACQUIRERS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </Select>
                <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-auto">
                  <option value="Todos">Todos os status</option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </>
            }
            right={<span className="text-sm text-muted">{filtered.length} lotes</span>}
          />

          <div className="mt-5">
            <DataTable
              columns={columns}
              rows={filtered}
              keyField={(b) => b.id}
              onRowClick={setSelected}
              pageSize={12}
              minWidth={1040}
              emptyLabel="Nenhum lote para os filtros."
            />
          </div>
        </SectionCard>

        <SectionCard title="Conciliado vs. divergente por adquirente" description="Valores no período selecionado">
          <BarsChart
            data={byAcquirer}
            height={300}
            series={[
              { key: 'Conciliado', name: 'Conciliado', color: '#10b981' },
              { key: 'Divergente', name: 'Divergente', color: '#f43f5e' },
            ]}
            valueFormatter={(v) => formatCurrency(v)}
          />
        </SectionCard>
      </div>

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.id ?? ''}
        subtitle={selected ? `${selected.acquirer} · ${formatShort(selected.date)}` : ''}
        footer={
          selected &&
          selected.status !== 'Conciliado' && (
            <Button variant="success" size="sm" className="w-full" onClick={() => markConciliated(selected)}>
              <Check className="h-4 w-4" /> Marcar como conciliado
            </Button>
          )
        }
      >
        {selected && (
          <>
            <div className="mb-6 flex items-center justify-between rounded-2xl border border-border bg-card-muted/40 p-4">
              <div>
                <p className="text-xs text-muted">Valor líquido</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(selected.valorLiquido)}</p>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <DrawerSection title="Lote">
              <DetailRow label="ID do lote" value={selected.id} />
              <DetailRow label="Adquirente" value={selected.acquirer} />
              <DetailRow label="Data" value={formatShort(selected.date)} />
              <DetailRow label="Transações" value={formatNumber(selected.transacoes)} />
            </DrawerSection>

            <DrawerSection title="Valores">
              <DetailRow label="Valor bruto" value={formatCurrency(selected.valorBruto)} />
              <DetailRow label="Taxas" value={<span className="text-danger">− {formatCurrency(selected.taxas)}</span>} />
              <DetailRow label="Valor líquido" value={formatCurrency(selected.valorLiquido)} />
              <DetailRow label="Recebido (extrato)" value={formatCurrency(selected.valorRecebido)} />
              <DetailRow
                label="Divergência"
                value={
                  <span className={selected.divergencia !== 0 ? 'text-danger' : 'text-success'}>
                    {selected.divergencia !== 0 ? formatCurrency(selected.divergencia) : 'Sem divergência'}
                  </span>
                }
              />
            </DrawerSection>

            {selected.divergencia !== 0 && (
              <div className="flex gap-3 rounded-2xl border border-border bg-danger/10 p-4 text-sm">
                <AlertTriangle className="h-5 w-5 shrink-0 text-danger" />
                <p className="text-muted">
                  {selected.status === 'Pendente'
                    ? 'Liquidação ainda não creditada no extrato do adquirente. Aguarde o crédito ou acione a conciliação manual.'
                    : `Diferença de ${formatCurrency(Math.abs(selected.divergencia))} entre o valor líquido esperado e o creditado pelo adquirente. Verifique taxas, estornos e ajustes do período.`}
                </p>
              </div>
            )}
          </>
        )}
      </Drawer>
    </>
  )
}
