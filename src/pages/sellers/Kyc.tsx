import { useMemo, useState } from 'react'
import { Clock, CheckCircle2, XCircle, Timer, ShieldCheck, FileText } from 'lucide-react'
import {
  PageHeader,
  KpiCard,
  SectionCard,
  DataTable,
  StatusBadge,
  RiskBadge,
  Avatar,
  ProgressBar,
  StateTabs,
  Drawer,
  DetailRow,
  DrawerSection,
  Button,
  Badge,
  type Column,
} from '../../components/ui'
import { kycQueue, sellerKycSummary, kycRiskLevel, type KycItem } from '../../data/sellersData'
import { formatNumber } from '../../lib/utils'
import { formatDateTime, timeAgo } from '../../lib/date'
import { useToast } from '../../components/ui/Toast'

const TABS = ['Todos', 'Em Análise', 'Pendente Documentos', 'Aprovado', 'Reprovado'] as const

function progressTone(score: number): 'success' | 'warning' | 'danger' {
  if (score >= 55) return 'danger'
  if (score >= 30) return 'warning'
  return 'success'
}

export default function Kyc() {
  const { toast } = useToast()
  const [active, setActive] = useState<string>('Todos')
  const [selected, setSelected] = useState<KycItem | null>(null)

  const tabs = useMemo(
    () =>
      TABS.map((label) => ({
        label,
        count: label === 'Todos' ? kycQueue.length : kycQueue.filter((k) => k.status === label).length,
      })),
    [],
  )

  const filtered = useMemo(
    () => (active === 'Todos' ? kycQueue : kycQueue.filter((k) => k.status === active)),
    [active],
  )

  const columns: Column<KycItem>[] = [
    {
      header: 'Loja',
      cell: (k) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={k.sellerName} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{k.sellerName}</p>
            <p className="truncate text-xs text-muted">{k.segment}</p>
          </div>
        </div>
      ),
    },
    { header: 'Documento', cell: (k) => <span className="text-muted">{k.document}</span>, nowrap: true },
    { header: 'Enviado', cell: (k) => <span className="text-muted">{timeAgo(k.submittedAt)}</span>, nowrap: true },
    {
      header: 'Risco',
      cell: (k) => (
        <div className="flex items-center gap-3">
          <div className="w-24">
            <ProgressBar value={k.riskScore} tone={progressTone(k.riskScore)} />
          </div>
          <span className="w-8 text-xs font-semibold text-muted">{k.riskScore}</span>
        </div>
      ),
      nowrap: true,
    },
    { header: 'Status', cell: (k) => <StatusBadge status={k.status} />, nowrap: true },
  ]

  function handleDecision(item: KycItem, approved: boolean) {
    toast(
      approved ? `KYC de ${item.sellerName} aprovado` : `KYC de ${item.sellerName} reprovado`,
      approved ? 'success' : 'error',
    )
    setSelected(null)
  }

  return (
    <>
      <PageHeader title="KYC & Onboarding" subtitle="Fila de aprovação de cadastros e verificação de identidade" />

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Pendentes na fila" value={formatNumber(sellerKycSummary.pendentes)} icon={Clock} />
          <KpiCard label="Aprovados no mês" value={formatNumber(sellerKycSummary.aprovadosMes)} icon={CheckCircle2} delta={6.2} />
          <KpiCard
            label="Reprovados no mês"
            value={formatNumber(sellerKycSummary.reprovadosMes)}
            icon={XCircle}
            delta={-1.0}
            invertDelta
          />
          <KpiCard label="Tempo médio de análise" value={`${sellerKycSummary.tempoMedioH}h`} icon={Timer} hint="da submissão à decisão" />
        </div>

        <SectionCard
          title="Fila de verificação"
          description="Clique em um cadastro para revisar os documentos enviados"
        >
          <StateTabs tabs={tabs} active={active} onChange={setActive} />
          <div className="mt-5">
            <DataTable
              columns={columns}
              rows={filtered}
              keyField={(k) => k.id}
              onRowClick={setSelected}
              pageSize={10}
              minWidth={820}
              emptyLabel="Nenhum cadastro neste status."
              emptyIcon={<FileText className="h-8 w-8" />}
            />
          </div>
        </SectionCard>
      </div>

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.sellerName ?? ''}
        subtitle={selected ? `${selected.document} · ${selected.segment}` : ''}
        width="lg"
        footer={
          selected && (
            <div className="flex gap-2">
              <Button variant="danger" size="sm" className="flex-1" onClick={() => handleDecision(selected, false)}>
                <XCircle className="h-4 w-4" /> Reprovar
              </Button>
              <Button variant="success" size="sm" className="flex-1" onClick={() => handleDecision(selected, true)}>
                <ShieldCheck className="h-4 w-4" /> Aprovar KYC
              </Button>
            </div>
          )
        }
      >
        {selected && (
          <>
            <div className="mb-6 flex items-center justify-between rounded-2xl border border-border bg-card-muted/40 p-4">
              <div>
                <p className="text-xs text-muted">Score de risco</p>
                <p className="text-2xl font-bold text-foreground">{selected.riskScore}/100</p>
              </div>
              <RiskBadge level={kycRiskLevel(selected.riskScore)} />
            </div>

            <DrawerSection title="Análise de risco">
              <ProgressBar value={selected.riskScore} tone={progressTone(selected.riskScore)} />
              <p className="mt-2 text-xs text-muted">
                Score automatizado de antifraude — quanto maior, maior a atenção necessária na análise manual.
              </p>
            </DrawerSection>

            <DrawerSection title="Cadastro">
              <DetailRow label="Loja" value={selected.sellerName} />
              <DetailRow label="Documento" value={selected.document} />
              <DetailRow label="Segmento" value={selected.segment} />
              <DetailRow label="Enviado em" value={formatDateTime(selected.submittedAt)} />
              <DetailRow label="Status" value={<StatusBadge status={selected.status} />} />
            </DrawerSection>

            <DrawerSection title="Documentos enviados">
              <div className="space-y-2">
                {selected.docs.map((d) => (
                  <div
                    key={d.tipo}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card-muted/30 px-3.5 py-2.5"
                  >
                    <span className="flex items-center gap-2.5 text-sm text-foreground">
                      <FileText className="h-4 w-4 shrink-0 text-muted" />
                      {d.tipo}
                    </span>
                    <StatusBadge status={d.status} />
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
                <Badge tone="success">{selected.docs.filter((d) => d.status === 'Verificado').length} verificados</Badge>
                <Badge tone="warning">{selected.docs.filter((d) => d.status === 'Pendente').length} pendentes</Badge>
                <Badge tone="danger">{selected.docs.filter((d) => d.status === 'Reprovado').length} reprovados</Badge>
              </div>
            </DrawerSection>
          </>
        )}
      </Drawer>
    </>
  )
}
