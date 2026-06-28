import { useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  MessageCircle,
  LogIn,
  Ban,
  Banknote,
  Clock,
  Wallet,
  Lock,
  Save,
  Plus,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import {
  PageHeader,
  KpiCard,
  SectionCard,
  Card,
  DataTable,
  StatusBadge,
  RiskBadge,
  MethodBadge,
  Avatar,
  Button,
  IconButton,
  Field,
  Input,
  Select,
  ToggleRow,
  Badge,
  DetailRow,
  StateTabs,
  type Column,
} from '../../components/ui'
import { useToast } from '../../components/ui/Toast'
import { AreaTrend, BarsChart } from '../../components/charts/Charts'
import { sellerById, ACQUIRERS } from '../../data/shared'
import { getSellerDetail, type SellerDetail, type SellerTxRow } from '../../data/sellersData'
import {
  getSellerTabs,
  type MedsData,
  type MedRow,
  type ReservaData,
  type TabKycData,
  type ConfigData,
  type GestaoSaldoData,
  type AjusteRow,
  type CoProdutorRow,
  type SubcontaRow,
  type AdquirentesPorMetodo,
  type LucroAdquirenteRow,
  type TaxaMetodoRow,
} from '../../data/sellerTabsData'
import { formatCurrency, formatCompact, formatPercent, formatNumber } from '../../lib/utils'
import { formatDateTime, formatShort } from '../../lib/date'

const TABS = [
  'Métricas',
  'Transações',
  'MEDs',
  'Reserva',
  'KYC',
  'Taxas',
  'Configurações',
  'Gestão de Saldo',
  'Co-Produção',
  'Subcontas',
  'Adquirentes',
  'Lucro por Adquirente',
] as const

export default function SellerDetalhe() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const seller = sellerById(id)
  const detail = getSellerDetail(id)
  const tabs = getSellerTabs(id)

  const [active, setActive] = useState<string>('Métricas')

  if (!seller || !detail || !tabs) {
    return (
      <Card className="flex flex-col items-center justify-center gap-4 p-14 text-center">
        <p className="text-base font-semibold text-foreground">Seller não encontrado</p>
        <p className="max-w-sm text-sm text-muted">
          O seller que você procura não existe ou foi removido da base.
        </p>
        <Link to="/sellers">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" /> Voltar para Sellers
          </Button>
        </Link>
      </Card>
    )
  }

  return (
    <>
      <PageHeader
        title={seller.name}
        subtitle={`${seller.document} · ${seller.segment} · ${seller.status}`}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://wa.me/5511999999999', '_blank')}
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </Button>
            <Button size="sm" onClick={() => toast('Acessando conta do seller…', 'info')}>
              <LogIn className="h-4 w-4" /> Acessar Conta
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => toast(`${seller.name} suspenso`, 'error')}
            >
              <Ban className="h-4 w-4" /> Suspender
            </Button>
          </>
        }
      />

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Volume 30d" value={formatCurrency(seller.volume30d)} icon={Banknote} hint="Vendas no período" />
          <KpiCard label="A receber" value={formatCurrency(detail.aReceber)} icon={Clock} hint="Liquidações futuras" />
          <KpiCard label="Saldo disponível" value={formatCurrency(detail.saldoDisponivel)} icon={Wallet} hint="Carteira do seller" />
          <KpiCard label="Reserva / Protesto" value={formatCurrency(tabs.reserva.retida)} icon={Lock} hint={`Retido (${formatPercent(tabs.reserva.percentual, 0)})`} />
        </div>

        <SectionCard bodyClassName="space-y-6">
          <StateTabs tabs={TABS.map((label) => ({ label }))} active={active} onChange={setActive} />

          {active === 'Métricas' && <TabMetricas detail={detail} />}
          {active === 'Transações' && <TabTransacoes rows={detail.lastTransactions} />}
          {active === 'MEDs' && <TabMeds meds={tabs.meds} />}
          {active === 'Reserva' && <TabReserva reserva={tabs.reserva} />}
          {active === 'KYC' && <TabKyc kyc={tabs.kyc} seller={seller} />}
          {active === 'Taxas' && <TabTaxas taxas={tabs.taxasPorMetodo} onSave={() => toast('Taxas atualizadas', 'success')} />}
          {active === 'Configurações' && <TabConfig config={tabs.config} onSave={() => toast('Configurações salvas', 'success')} />}
          {active === 'Gestão de Saldo' && <TabGestaoSaldo gestao={tabs.gestaoSaldo} onConfirm={() => toast('Saque manual confirmado', 'success')} />}
          {active === 'Co-Produção' && <TabCoProducao lista={tabs.coProdutores} onAdd={() => toast('Co-produtor adicionado', 'success')} />}
          {active === 'Subcontas' && <TabSubcontas lista={tabs.subcontas} />}
          {active === 'Adquirentes' && <TabAdquirentes adquirentes={tabs.adquirentesPorMetodo} onSave={() => toast('Roteamento de adquirentes salvo', 'success')} />}
          {active === 'Lucro por Adquirente' && <TabLucro lista={tabs.lucroPorAdquirente} />}
        </SectionCard>
      </div>
    </>
  )
}

/* ============================== Métricas ============================== */

function TabMetricas({ detail }: { detail: SellerDetail }) {
  const trendData = detail.volume14d.map((p) => ({ label: p.label, Volume: p.volume }))
  const porMetodo = useMemo(() => {
    return detail.fees.map((f) => ({
      method: f.method,
      mdr: f.mdr,
      liquidacao: f.liquidacao,
    }))
  }, [detail.fees])

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
      <SectionCard title="Volume transacionado" description="Últimos 14 dias" className="bg-card-muted/30">
        <AreaTrend
          data={trendData}
          height={300}
          series={[{ key: 'Volume', name: 'Volume', color: '#2f6bff' }]}
          yFormatter={(v) => formatCompact(v)}
          valueFormatter={(v) => formatCurrency(v)}
        />
      </SectionCard>

      <SectionCard title="MDR por método" description="Taxa atual e liquidação" className="bg-card-muted/30">
        <div className="space-y-3">
          {porMetodo.map((m) => (
            <div key={m.method} className="flex items-center justify-between rounded-2xl border border-border bg-card p-3.5">
              <div className="flex items-center gap-2.5">
                <MethodBadge method={m.method} />
                <span className="text-xs text-muted">{m.liquidacao}</span>
              </div>
              <span className="text-sm font-bold text-foreground">{formatPercent(m.mdr, 2)}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

/* ============================= Transações ============================= */

function TabTransacoes({ rows }: { rows: SellerTxRow[] }) {
  const columns: Column<SellerTxRow>[] = [
    {
      header: 'Transação',
      cell: (t) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={t.customer} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{t.customer}</p>
            <p className="truncate text-xs text-muted">{t.id}</p>
          </div>
        </div>
      ),
    },
    { header: 'Método', cell: (t) => <MethodBadge method={t.method} />, nowrap: true },
    { header: 'Data', cell: (t) => <span className="text-muted">{formatDateTime(t.date)}</span>, nowrap: true },
    {
      header: 'Valor',
      align: 'right',
      cell: (t) => <span className="font-semibold text-foreground">{formatCurrency(t.gross)}</span>,
      nowrap: true,
    },
    { header: 'Status', cell: (t) => <StatusBadge status={t.status} />, nowrap: true },
  ]

  return (
    <SectionCard title="Últimas transações" description="Movimentações mais recentes do seller">
      <DataTable
        columns={columns}
        rows={rows}
        keyField={(t) => t.id}
        minWidth={680}
        emptyLabel="Sem transações recentes."
      />
    </SectionCard>
  )
}

/* ================================ MEDs =============================== */

function TabMeds({ meds }: { meds: MedsData }) {
  const columns: Column<MedRow>[] = [
    {
      header: 'Cliente',
      cell: (m) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={m.customer} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{m.customer}</p>
            <p className="truncate text-xs text-muted">{m.id}</p>
          </div>
        </div>
      ),
    },
    { header: 'Motivo', cell: (m) => <span className="text-muted">{m.motivo}</span> },
    { header: 'Data', cell: (m) => <span className="text-muted">{formatShort(m.date)}</span>, nowrap: true },
    {
      header: 'Valor',
      align: 'right',
      cell: (m) => <span className="font-semibold text-foreground">{formatCurrency(m.valor)}</span>,
      nowrap: true,
    },
    { header: 'Status', cell: (m) => <StatusBadge status={m.status} />, nowrap: true },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total estornado" value={formatCurrency(meds.totalEstornado)} icon={Banknote} hint="Acumulado em MEDs/estornos" />
        <KpiCard label="% de estorno" value={formatPercent(meds.pctEstorno, 2)} icon={ShieldCheck} hint="Sobre o volume" />
        <KpiCard label="Disputas abertas" value={formatNumber(meds.lista.filter((m) => m.status === 'Aberta' || m.status === 'Em Análise').length)} icon={Clock} />
        <KpiCard label="Total de MEDs" value={formatNumber(meds.lista.length)} icon={Lock} />
      </div>

      <SectionCard title="Histórico de MEDs" description="Estornos e disputas do seller">
        <DataTable
          columns={columns}
          rows={meds.lista}
          keyField={(m) => m.id}
          minWidth={760}
          pageSize={8}
          emptyLabel="Sem MEDs registradas."
        />
      </SectionCard>
    </div>
  )
}

/* =============================== Reserva ============================== */

function TabReserva({ reserva }: { reserva: ReservaData }) {
  const chartData = reserva.historico.map((h) => ({ label: h.label, Retido: h.retido, Liberado: h.liberado }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Reserva retida" value={formatCurrency(reserva.retida)} icon={Lock} hint="Saldo em protesto" />
        <KpiCard label="Já liberada" value={formatCurrency(reserva.liberada)} icon={Wallet} hint="Acumulado liberado" />
        <KpiCard label="Percentual" value={formatPercent(reserva.percentual, 0)} icon={ShieldCheck} hint="Retido por transação" />
        <KpiCard label="Próxima liberação" value={formatShort(reserva.proximaLiberacao)} icon={Clock} />
      </div>

      <SectionCard title="Reserva: retido vs. liberado" description="Últimos 6 meses">
        <BarsChart
          data={chartData}
          height={300}
          series={[
            { key: 'Retido', name: 'Retido', color: '#f5c043' },
            { key: 'Liberado', name: 'Liberado', color: '#10b981' },
          ]}
          valueFormatter={(v) => formatCurrency(v)}
        />
      </SectionCard>
    </div>
  )
}

/* ================================ KYC =============================== */

function TabKyc({
  kyc,
  seller,
}: {
  kyc: TabKycData
  seller: NonNullable<ReturnType<typeof sellerById>>
}) {
  const cerberusTone =
    kyc.cerberusStatus === 'Aprovado' ? 'success' : kyc.cerberusStatus === 'Pendente' ? 'warning' : 'neutral'

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <SectionCard title="Análise Cerberus" description="Consulta antifraude / KYC">
        <div className="mb-5 flex items-center justify-between rounded-2xl border border-border bg-card-muted/40 p-4">
          <div>
            <p className="text-xs text-muted">Status da consulta</p>
            <p className="mt-1 text-lg font-bold text-foreground">{kyc.cerberusStatus}</p>
          </div>
          <Badge tone={cerberusTone}>{kyc.cerberusStatus}</Badge>
        </div>
        <DetailRow label="Ambiente" value={kyc.ambiente} />
        <DetailRow label="Resultado" value={kyc.resultado} />
        <DetailRow label="Risco do seller" value={<RiskBadge level={seller.risk} />} />
        <DetailRow label="Status do cadastro" value={<StatusBadge status={seller.status} />} />

        <div className="mt-5 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-faint">Apontamentos</p>
          {kyc.extras.map((e) => (
            <div key={e} className="flex items-center gap-2 text-sm text-muted">
              <ShieldCheck className="h-4 w-4 shrink-0 text-success" />
              {e}
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Documentos" description="Status de verificação documental">
        <div className="space-y-2.5">
          {kyc.docs.map((d) => (
            <div key={d.tipo} className="flex items-center justify-between rounded-2xl border border-border bg-card p-3.5">
              <span className="text-sm text-foreground">{d.tipo}</span>
              <StatusBadge status={d.status} />
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

/* ================================ Taxas ============================== */

function TabTaxas({ taxas, onSave }: { taxas: TaxaMetodoRow[]; onSave: () => void }) {
  return (
    <SectionCard
      title="Taxas por método"
      description="Configuração de entrada, saque, reserva e retenção"
      action={
        <Button size="sm" onClick={onSave}>
          <Save className="h-4 w-4" /> Salvar taxas
        </Button>
      }
    >
      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full border-collapse text-sm" style={{ minWidth: 880 }}>
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-3 py-3 font-semibold first:pl-0">Método</th>
              <th className="px-3 py-3 font-semibold">Entrada fixa (R$)</th>
              <th className="px-3 py-3 font-semibold">Entrada var (%)</th>
              <th className="px-3 py-3 font-semibold">Saque fixa (R$)</th>
              <th className="px-3 py-3 font-semibold">Saque var (%)</th>
              <th className="px-3 py-3 font-semibold">Reserva (%)</th>
              <th className="px-3 py-3 font-semibold last:pr-0">Retenção (dias)</th>
            </tr>
          </thead>
          <tbody>
            {taxas.map((t) => (
              <tr key={t.metodo} className="border-b border-border/60 last:border-0">
                <td className="px-3 py-3 first:pl-0">
                  <MethodBadge method={t.metodo} />
                </td>
                <td className="px-3 py-3">
                  <Input type="number" step="0.01" defaultValue={t.entradaFixa} className="w-28" />
                </td>
                <td className="px-3 py-3">
                  <Input type="number" step="0.01" defaultValue={t.entradaVarPct} className="w-28" />
                </td>
                <td className="px-3 py-3">
                  <Input type="number" step="0.01" defaultValue={t.saqueFixa} className="w-28" />
                </td>
                <td className="px-3 py-3">
                  <Input type="number" step="0.01" defaultValue={t.saqueVarPct} className="w-28" />
                </td>
                <td className="px-3 py-3">
                  <Input type="number" step="1" defaultValue={t.reservaPct} className="w-24" />
                </td>
                <td className="px-3 py-3 last:pr-0">
                  <Input type="number" step="1" defaultValue={t.prazoRetencaoDias} className="w-24" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  )
}

/* ============================ Configurações ========================== */

function TabConfig({
  config,
  onSave,
}: {
  config: ConfigData
  onSave: () => void
}) {
  const [permissoes, setPermissoes] = useState(config.permissoes)
  const [saqueAutomatico, setSaqueAutomatico] = useState(config.saqueAutomatico)
  const [apiCashout, setApiCashout] = useState(config.apiCashout)
  const [roteamentoAtivo, setRoteamentoAtivo] = useState(config.roteamentoAtivo)

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <SectionCard title="Permissões e recursos" description="Métodos habilitados e automações">
        <div className="divide-y divide-border/60">
          <ToggleRow label="Pix" description="Recebimento via Pix" checked={permissoes.pix} onChange={(v) => setPermissoes((p) => ({ ...p, pix: v }))} />
          <ToggleRow label="Cartão" description="Crédito e débito" checked={permissoes.cartao} onChange={(v) => setPermissoes((p) => ({ ...p, cartao: v }))} />
          <ToggleRow label="Boleto" description="Boleto bancário" checked={permissoes.boleto} onChange={(v) => setPermissoes((p) => ({ ...p, boleto: v }))} />
          <ToggleRow label="Cripto" description="Recebimento em cripto" checked={permissoes.cripto} onChange={(v) => setPermissoes((p) => ({ ...p, cripto: v }))} />
          <ToggleRow label="Saque automático" description="Liquidação automática para a conta" checked={saqueAutomatico} onChange={setSaqueAutomatico} />
          <ToggleRow label="API de Cashout" description="Saques via API" checked={apiCashout} onChange={setApiCashout} />
          <ToggleRow label="Roteamento inteligente" description="Distribui transações entre adquirentes" checked={roteamentoAtivo} onChange={setRoteamentoAtivo} />
        </div>
      </SectionCard>

      <SectionCard
        title="Limites operacionais"
        description="Tetos de depósito, saque e boleto"
        action={
          <Button size="sm" onClick={onSave}>
            <Save className="h-4 w-4" /> Salvar
          </Button>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Depósito máximo (R$)">
            <Input type="number" defaultValue={config.depositoMax} />
          </Field>
          <Field label="Saque máximo (R$)">
            <Input type="number" defaultValue={config.saqueMax} />
          </Field>
          <Field label="Boleto mínimo (R$)">
            <Input type="number" defaultValue={config.boleto.min} />
          </Field>
          <Field label="Boleto máximo (R$)">
            <Input type="number" defaultValue={config.boleto.max} />
          </Field>
          <Field label="Boletos por mês">
            <Input type="number" defaultValue={config.boleto.porMes} />
          </Field>
          <Field label="Liberação boleto (dias)">
            <Input type="number" defaultValue={config.boleto.diasLiberacao} />
          </Field>
        </div>
      </SectionCard>
    </div>
  )
}

/* =========================== Gestão de Saldo ========================= */

function TabGestaoSaldo({
  gestao,
  onConfirm,
}: {
  gestao: GestaoSaldoData
  onConfirm: () => void
}) {
  const ajusteTone = (tipo: AjusteRow['tipo']) =>
    tipo === 'Crédito' || tipo === 'Liberação' ? 'success' : tipo === 'Débito' ? 'warning' : 'danger'

  const columns: Column<AjusteRow>[] = [
    { header: 'Tipo', cell: (a) => <Badge tone={ajusteTone(a.tipo)}>{a.tipo}</Badge>, nowrap: true },
    { header: 'Origem', cell: (a) => <span className="text-muted">{a.origem}</span> },
    { header: 'Data', cell: (a) => <span className="text-muted">{formatDateTime(a.date)}</span>, nowrap: true },
    {
      header: 'Valor',
      align: 'right',
      cell: (a) => <span className="font-semibold text-foreground">{formatCurrency(a.valor)}</span>,
      nowrap: true,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <SectionCard title="Saque manual" description="Mover saldo operacional do seller">
          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card-muted/40 p-4">
              <p className="text-xs text-muted">Saldo operacional</p>
              <p className="mt-1 text-xl font-bold text-foreground">{formatCurrency(gestao.saldoOperacional)}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card-muted/40 p-4">
              <p className="text-xs text-muted">Bloqueado</p>
              <p className="mt-1 text-xl font-bold text-foreground">{formatCurrency(gestao.bloqueado)}</p>
            </div>
          </div>
          <div className="space-y-4">
            <Field label="Valor do saque (R$)">
              <Input type="number" placeholder="0,00" />
            </Field>
            <Field label="Chave Pix de destino">
              <Input placeholder="email, CPF/CNPJ ou aleatória" />
            </Field>
            <Field label="Observação" hint="Registrada no histórico de ajustes">
              <Input placeholder="Motivo do saque manual" />
            </Field>
            <Button className="w-full" onClick={onConfirm}>
              <Banknote className="h-4 w-4" /> Confirmar saque manual
            </Button>
          </div>
        </SectionCard>

        <SectionCard title="Últimos ajustes" description="Créditos, débitos e bloqueios">
          <DataTable
            columns={columns}
            rows={gestao.ultimosAjustes}
            keyField={(a) => a.id}
            minWidth={620}
            pageSize={8}
            emptyLabel="Sem ajustes registrados."
          />
        </SectionCard>
      </div>
    </div>
  )
}

/* ============================= Co-Produção ========================== */

function TabCoProducao({ lista, onAdd }: { lista: CoProdutorRow[]; onAdd: () => void }) {
  const columns: Column<CoProdutorRow>[] = [
    {
      header: 'Co-produtor',
      cell: (c) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={c.email} size="sm" />
          <span className="truncate font-medium text-foreground">{c.email}</span>
        </div>
      ),
    },
    {
      header: 'Participação',
      align: 'right',
      cell: (c) => <span className="font-semibold text-foreground">{formatPercent(c.percentual, 0)}</span>,
      nowrap: true,
    },
    { header: 'Desde', cell: (c) => <span className="text-muted">{formatShort(c.date)}</span>, nowrap: true },
    {
      header: '',
      align: 'right',
      cell: () => (
        <IconButton label="Remover">
          <Trash2 className="h-4 w-4" />
        </IconButton>
      ),
      nowrap: true,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
      <SectionCard title="Adicionar co-produtor" description="Split de comissão por participação">
        <div className="space-y-4">
          <Field label="E-mail do co-produtor">
            <Input type="email" placeholder="nome@email.com" />
          </Field>
          <Field label="Participação (%)" hint="Percentual sobre cada venda">
            <Input type="number" step="1" placeholder="10" />
          </Field>
          <Button className="w-full" onClick={onAdd}>
            <Plus className="h-4 w-4" /> Adicionar co-produtor
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Co-produtores ativos" description="Splits configurados">
        <DataTable
          columns={columns}
          rows={lista}
          keyField={(c) => c.id}
          minWidth={560}
          emptyLabel="Nenhum co-produtor configurado."
        />
      </SectionCard>
    </div>
  )
}

/* ============================== Subcontas =========================== */

function TabSubcontas({ lista }: { lista: SubcontaRow[] }) {
  const columns: Column<SubcontaRow>[] = [
    {
      header: 'Subconta',
      cell: (s) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={s.nome} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{s.nome}</p>
            <p className="truncate text-xs text-muted">{s.id}</p>
          </div>
        </div>
      ),
    },
    { header: 'Documento', cell: (s) => <span className="text-muted">{s.documento}</span>, nowrap: true },
    {
      header: 'Saldo',
      align: 'right',
      cell: (s) => <span className="font-semibold text-foreground">{formatCurrency(s.saldo)}</span>,
      nowrap: true,
    },
    { header: 'Status', cell: (s) => <StatusBadge status={s.status} />, nowrap: true },
  ]

  return (
    <SectionCard title="Subcontas" description="Contas vinculadas a este seller">
      <DataTable
        columns={columns}
        rows={lista}
        keyField={(s) => s.id}
        minWidth={640}
        emptyLabel="Nenhuma subconta vinculada."
      />
    </SectionCard>
  )
}

/* ============================= Adquirentes ========================== */

function TabAdquirentes({
  adquirentes,
  onSave,
}: {
  adquirentes: AdquirentesPorMetodo
  onSave: () => void
}) {
  const rows: { label: string; value: string }[] = [
    { label: 'PIX IN', value: adquirentes.pixIn },
    { label: 'PIX OUT', value: adquirentes.pixOut },
    { label: 'Copia-e-cola', value: adquirentes.copiaCola },
    { label: 'Cartão', value: adquirentes.cartao },
    { label: 'Boleto', value: adquirentes.boleto },
  ]

  return (
    <SectionCard
      title="Roteamento de adquirentes"
      description="Adquirente padrão por tipo de operação"
      action={
        <Button size="sm" onClick={onSave}>
          <Save className="h-4 w-4" /> Salvar roteamento
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {rows.map((r) => (
          <Field key={r.label} label={r.label}>
            <Select defaultValue={r.value}>
              {ACQUIRERS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </Select>
          </Field>
        ))}
      </div>
    </SectionCard>
  )
}

/* ========================= Lucro por Adquirente ===================== */

function TabLucro({ lista }: { lista: LucroAdquirenteRow[] }) {
  const columns: Column<LucroAdquirenteRow>[] = [
    { header: 'Adquirente', cell: (l) => <span className="font-medium text-foreground">{l.acquirer}</span>, nowrap: true },
    {
      header: 'Volume',
      align: 'right',
      cell: (l) => <span className="text-muted">{formatCurrency(l.volume)}</span>,
      nowrap: true,
    },
    {
      header: 'Receita',
      align: 'right',
      cell: (l) => <span className="font-semibold text-foreground">{formatCurrency(l.receita)}</span>,
      nowrap: true,
    },
    {
      header: 'Custo',
      align: 'right',
      cell: (l) => <span className="text-muted">{formatCurrency(l.custo)}</span>,
      nowrap: true,
    },
    {
      header: 'Margem',
      align: 'right',
      cell: (l) => (
        <span className={l.margem >= 50 ? 'font-semibold text-success' : 'font-semibold text-warning'}>
          {formatPercent(l.margem, 1)}
        </span>
      ),
      nowrap: true,
    },
  ]

  const totalReceita = lista.reduce((s, l) => s + l.receita, 0)
  const totalCusto = lista.reduce((s, l) => s + l.custo, 0)
  const lucro = totalReceita - totalCusto

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Receita total" value={formatCurrency(totalReceita)} icon={Banknote} />
        <KpiCard label="Custo adquirência" value={formatCurrency(totalCusto)} icon={Wallet} />
        <KpiCard label="Lucro líquido" value={formatCurrency(lucro)} icon={ShieldCheck} hint="Receita − custo" />
      </div>

      <SectionCard title="Lucro por adquirente" description="Volume, receita, custo e margem">
        <DataTable
          columns={columns}
          rows={lista}
          keyField={(l) => l.acquirer}
          minWidth={680}
          emptyLabel="Sem dados de adquirência."
        />
      </SectionCard>
    </div>
  )
}
