import { useMemo } from 'react'
import { ShieldCheck, Store, CalendarClock } from 'lucide-react'
import {
  PageHeader,
  KpiCard,
  SectionCard,
  DataTable,
  Avatar,
  ProgressBar,
  type Column,
} from '../../components/ui'
import { reservas, type Reserva } from '../../data/financeiroData'
import { formatCurrency, formatNumber } from '../../lib/utils'
import { formatShort, addDays } from '../../lib/date'

const reservaTotal = reservas.reduce((s, r) => s + r.retido, 0)

export default function Reservas() {
  const liberadas7d = useMemo(() => {
    const limite = addDays(new Date(), 7).getTime()
    return reservas
      .filter((r) => r.liberadoPrevisto.getTime() <= limite)
      .reduce((s, r) => s + r.retido, 0)
  }, [])

  const columns: Column<Reserva>[] = [
    {
      header: 'Seller',
      cell: (r) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={r.sellerName} size="sm" />
          <span className="truncate font-medium text-foreground">{r.sellerName}</span>
        </div>
      ),
    },
    {
      header: '% Reserva',
      cell: (r) => (
        <div className="flex items-center gap-3">
          <ProgressBar
            value={(r.percentual / 30) * 100}
            tone={r.percentual >= 20 ? 'warning' : 'primary'}
            className="w-28"
          />
          <span className="w-10 text-right text-sm font-semibold text-foreground">{r.percentual}%</span>
        </div>
      ),
      nowrap: true,
    },
    {
      header: 'Valor retido',
      align: 'right',
      cell: (r) => <span className="font-semibold text-foreground">{formatCurrency(r.retido)}</span>,
      nowrap: true,
    },
    {
      header: 'Liberação prevista',
      cell: (r) => <span className="text-muted">{formatShort(r.liberadoPrevisto)}</span>,
      nowrap: true,
    },
    { header: 'Motivo', cell: (r) => <span className="text-muted">{r.motivo}</span> },
  ]

  return (
    <>
      <PageHeader title="Reservas" subtitle="Reserva financeira retida por risco" />

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard label="Reserva total retida" value={formatCurrency(reservaTotal)} icon={ShieldCheck} hint="Saldo em garantia" />
          <KpiCard label="Sellers com reserva" value={formatNumber(reservas.length)} icon={Store} />
          <KpiCard label="Liberação prevista (7d)" value={formatCurrency(liberadas7d)} icon={CalendarClock} hint="A liberar nos próximos 7 dias" />
        </div>

        <SectionCard title="Reservas por seller" description="Política de reserva financeira da plataforma">
          <p className="mb-5 max-w-3xl text-sm text-muted">
            A reserva financeira retém um percentual do volume transacionado para cobrir eventuais
            chargebacks, MEDs e estornos. O valor fica em garantia e é liberado automaticamente na data
            prevista, conforme o nível de risco do seller e o histórico de disputas. Sellers novos ou com
            indicadores acima da média do segmento ficam sujeitos a percentuais maiores.
          </p>

          <DataTable
            columns={columns}
            rows={reservas}
            keyField={(r) => r.sellerId}
            pageSize={10}
            minWidth={840}
            emptyLabel="Nenhuma reserva ativa."
          />
        </SectionCard>
      </div>
    </>
  )
}
