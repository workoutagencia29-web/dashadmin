import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Store, UserPlus, Banknote, ShieldAlert } from 'lucide-react'
import {
  PageHeader,
  KpiCard,
  SectionCard,
  SearchInput,
  MultiSelect,
  Select,
  DataTable,
  StatusBadge,
  RiskBadge,
  Avatar,
  Toolbar,
  ExportButtons,
  downloadCsv,
  type Column,
} from '../../components/ui'
import { sellers, SEGMENTS, type Seller } from '../../data/shared'
import { formatCurrency, formatPercent, formatNumber } from '../../lib/utils'

const STATUSES: Seller['status'][] = ['Ativo', 'Suspenso', 'Em Análise KYC', 'Em Onboarding', 'Banido']

export default function Sellers() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [segments, setSegments] = useState<string[]>([])
  const [status, setStatus] = useState('Todos')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return sellers.filter((s) => {
      if (q && !`${s.name} ${s.legalName} ${s.document} ${s.email}`.toLowerCase().includes(q)) return false
      if (segments.length && !segments.includes(s.segment)) return false
      if (status !== 'Todos' && s.status !== status) return false
      return true
    })
  }, [query, segments, status])

  // KPIs agregados sobre a base completa.
  const ativos = sellers.filter((s) => s.status === 'Ativo')
  const novosMes = sellers.filter((s) => s.joinedDays <= 30).length
  const volumeAgregado = sellers.reduce((acc, s) => acc + s.volume30d, 0)
  const cbComputaveis = sellers.filter((s) => s.volume30d > 0)
  const chargebackMedio =
    cbComputaveis.length > 0 ? cbComputaveis.reduce((acc, s) => acc + s.chargebackRate, 0) / cbComputaveis.length : 0

  const columns: Column<Seller>[] = [
    {
      header: 'Loja',
      cell: (s) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={s.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{s.name}</p>
            <p className="truncate text-xs text-muted">{s.document}</p>
          </div>
        </div>
      ),
    },
    { header: 'Segmento', cell: (s) => <span className="text-muted">{s.segment}</span>, nowrap: true },
    {
      header: 'Volume 30d',
      align: 'right',
      cell: (s) => <span className="font-semibold text-foreground">{formatCurrency(s.volume30d)}</span>,
      nowrap: true,
    },
    {
      header: 'Aprovação',
      align: 'right',
      cell: (s) =>
        s.approvalRate > 0 ? (
          <span className="text-foreground">{formatPercent(s.approvalRate)}</span>
        ) : (
          <span className="text-faint">—</span>
        ),
      nowrap: true,
    },
    {
      header: 'Chargeback',
      align: 'right',
      cell: (s) =>
        s.volume30d > 0 ? (
          <span className={s.chargebackRate > 2 ? 'font-semibold text-danger' : 'text-foreground'}>
            {formatPercent(s.chargebackRate, 2)}
          </span>
        ) : (
          <span className="text-faint">—</span>
        ),
      nowrap: true,
    },
    { header: 'Risco', cell: (s) => <RiskBadge level={s.risk} />, nowrap: true },
    { header: 'Status', cell: (s) => <StatusBadge status={s.status} />, nowrap: true },
  ]

  function exportCsv() {
    downloadCsv(
      'sellers.csv',
      ['ID', 'Loja', 'Razão Social', 'CNPJ', 'Segmento', 'Volume 30d', 'Aprovação', 'Chargeback', 'Risco', 'Status'],
      filtered.map((s) => [
        s.id,
        s.name,
        s.legalName,
        s.document,
        s.segment,
        s.volume30d,
        s.approvalRate,
        s.chargebackRate,
        s.risk,
        s.status,
      ]),
    )
  }

  return (
    <>
      <PageHeader
        title="Sellers"
        subtitle="Lojas e merchants conectados ao gateway"
        actions={<ExportButtons formats={['CSV', 'PDF']} onCsv={exportCsv} />}
      />

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Sellers ativos" value={formatNumber(ativos.length)} icon={Store} hint={`${sellers.length} no total`} />
          <KpiCard label="Novos no mês" value={formatNumber(novosMes)} icon={UserPlus} delta={12.5} />
          <KpiCard label="Volume agregado (30d)" value={formatCurrency(volumeAgregado)} icon={Banknote} delta={8.3} />
          <KpiCard
            label="Chargeback médio"
            value={formatPercent(chargebackMedio, 2)}
            icon={ShieldAlert}
            delta={-0.4}
            invertDelta
          />
        </div>

        <SectionCard>
          <Toolbar
            left={
              <>
                <SearchInput value={query} onChange={setQuery} placeholder="Loja, CNPJ, e-mail…" />
                <MultiSelect label="Segmento" options={SEGMENTS} selected={segments} onChange={setSegments} />
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
            right={<span className="text-sm text-muted">{filtered.length} sellers</span>}
          />

          <div className="mt-5">
            <DataTable
              columns={columns}
              rows={filtered}
              keyField={(s) => s.id}
              onRowClick={(s) => navigate(`/sellers/${s.id}`)}
              pageSize={10}
              minWidth={920}
              emptyLabel="Nenhum seller para os filtros."
            />
          </div>
        </SectionCard>
      </div>
    </>
  )
}
