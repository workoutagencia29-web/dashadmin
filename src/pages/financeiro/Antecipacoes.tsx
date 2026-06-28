import { useMemo, useState } from 'react'
import { Banknote, Percent, FileText, Check, X } from 'lucide-react'
import {
  PageHeader,
  KpiCard,
  SectionCard,
  DataTable,
  StatusBadge,
  Avatar,
  Button,
  type Column,
} from '../../components/ui'
import {
  antecipacoes as initialAntecipacoes,
  type Antecipacao,
  type AntecipacaoStatus,
} from '../../data/financeiroData'
import { formatCurrency, formatNumber, formatPercent } from '../../lib/utils'
import { formatShort } from '../../lib/date'
import { useToast } from '../../components/ui/Toast'

export default function Antecipacoes() {
  const { toast } = useToast()
  const [list, setList] = useState<Antecipacao[]>(initialAntecipacoes)

  const volumeAntecipado = useMemo(() => list.reduce((s, a) => s + a.bruto, 0), [list])
  const taxaMedia = useMemo(
    () => (list.length ? list.reduce((s, a) => s + a.taxa, 0) / list.length : 0),
    [list],
  )

  function updateStatus(id: string, next: AntecipacaoStatus, message: string) {
    setList((prev) => prev.map((a) => (a.id === id ? { ...a, status: next } : a)))
    toast(message, next === 'Rejeitado' ? 'error' : 'success')
  }

  const columns: Column<Antecipacao>[] = [
    {
      header: 'Seller',
      cell: (a) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={a.sellerName} size="sm" />
          <span className="truncate font-medium text-foreground">{a.sellerName}</span>
        </div>
      ),
    },
    {
      header: 'Bruto',
      align: 'right',
      cell: (a) => <span className="font-semibold text-foreground">{formatCurrency(a.bruto)}</span>,
      nowrap: true,
    },
    {
      header: 'Taxa',
      align: 'right',
      cell: (a) => <span className="text-muted">{formatPercent(a.taxa, 2)} a.m.</span>,
      nowrap: true,
    },
    {
      header: 'Líquido',
      align: 'right',
      cell: (a) => <span className="font-semibold text-success">{formatCurrency(a.liquido)}</span>,
      nowrap: true,
    },
    {
      header: 'Parcelas',
      align: 'center',
      cell: (a) => <span className="text-muted">{a.parcelas}x</span>,
      nowrap: true,
    },
    { header: 'Status', cell: (a) => <StatusBadge status={a.status} />, nowrap: true },
    {
      header: 'Data',
      cell: (a) => <span className="text-muted">{formatShort(a.date)}</span>,
      nowrap: true,
    },
    {
      header: 'Ações',
      align: 'right',
      cell: (a) =>
        a.status === 'Solicitado' ? (
          <div className="flex justify-end gap-2">
            <Button
              variant="success"
              size="sm"
              onClick={() => updateStatus(a.id, 'Concluído', `Antecipação de ${a.sellerName} aprovada`)}
            >
              <Check className="h-4 w-4" /> Aprovar
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => updateStatus(a.id, 'Rejeitado', `Antecipação de ${a.sellerName} rejeitada`)}
            >
              <X className="h-4 w-4" /> Rejeitar
            </Button>
          </div>
        ) : (
          <span className="text-xs text-faint">—</span>
        ),
      nowrap: true,
    },
  ]

  return (
    <>
      <PageHeader title="Antecipações" subtitle="Antecipação de recebíveis dos sellers" />

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard label="Volume antecipado" value={formatCurrency(volumeAntecipado)} icon={Banknote} hint="Valor bruto solicitado" />
          <KpiCard label="Taxa média" value={formatPercent(taxaMedia, 2)} icon={Percent} hint="Custo médio a.m." />
          <KpiCard label="Solicitações" value={formatNumber(list.length)} icon={FileText} />
        </div>

        <SectionCard title="Solicitações de antecipação" description="Aprove ou rejeite os pedidos pendentes">
          <DataTable
            columns={columns}
            rows={list}
            keyField={(a) => a.id}
            pageSize={10}
            minWidth={960}
            emptyLabel="Nenhuma antecipação registrada."
          />
        </SectionCard>
      </div>
    </>
  )
}
