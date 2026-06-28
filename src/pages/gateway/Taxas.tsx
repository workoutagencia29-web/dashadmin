import { useState } from 'react'
import { Plus, Star, Save, Info, Users } from 'lucide-react'
import {
  PageHeader,
  SectionCard,
  SubBlock,
  Field,
  Input,
  Button,
  IconButton,
  Badge,
  Modal,
  DataTable,
  type Column,
} from '../../components/ui'
import { useToast } from '../../components/ui/Toast'
import { feePlans, type FeePlan } from '../../data/gatewayData'
import { formatCurrency, formatPercent, formatNumber } from '../../lib/utils'

interface NewPlanForm {
  nome: string
  pixPct: string
  cartaoPct: string
  boletoPct: string
  antecipacaoPct: string
  saqueFixo: string
}

const EMPTY_FORM: NewPlanForm = {
  nome: '',
  pixPct: '0,99',
  cartaoPct: '3,99',
  boletoPct: '2,99',
  antecipacaoPct: '2,49',
  saqueFixo: '3,67',
}

export default function Taxas() {
  const { toast } = useToast()
  const [plans, setPlans] = useState<FeePlan[]>(feePlans)
  const [openNew, setOpenNew] = useState(false)
  const [form, setForm] = useState<NewPlanForm>(EMPTY_FORM)

  function setField(id: string, field: keyof FeePlan, value: number) {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)))
  }

  function setDefault(id: string) {
    setPlans((prev) => prev.map((p) => ({ ...p, default: p.id === id })))
    toast('Plano padrão atualizado')
  }

  function createPlan() {
    if (!form.nome.trim()) {
      toast('Informe o nome do plano', 'error')
      return
    }
    const parse = (v: string) => Number(v.replace(',', '.')) || 0
    const novo: FeePlan = {
      id: `plan_${Date.now().toString(36)}`,
      nome: form.nome.trim(),
      pixPct: parse(form.pixPct),
      cartaoPct: parse(form.cartaoPct),
      boletoPct: parse(form.boletoPct),
      antecipacaoPct: parse(form.antecipacaoPct),
      saqueFixo: parse(form.saqueFixo),
      sellers: 0,
    }
    setPlans((prev) => [...prev, novo])
    setOpenNew(false)
    setForm(EMPTY_FORM)
    toast('Plano criado com sucesso')
  }

  const rateColumns: Column<FeePlan>[] = [
    {
      header: 'Plano',
      cell: (p) => (
        <div className="flex items-center gap-2">
          <div>
            <p className="font-semibold text-foreground">{p.nome}</p>
            <p className="text-xs text-muted">{formatNumber(p.sellers)} sellers</p>
          </div>
          {p.default && (
            <Badge tone="info">
              <Star className="h-3 w-3" /> Padrão
            </Badge>
          )}
        </div>
      ),
      nowrap: true,
    },
    {
      header: 'Pix %',
      align: 'right',
      cell: (p) => (
        <Input
          value={String(p.pixPct).replace('.', ',')}
          onChange={(e) => setField(p.id, 'pixPct', Number(e.target.value.replace(',', '.')) || 0)}
          className="w-20 text-right"
        />
      ),
      nowrap: true,
    },
    {
      header: 'Cartão %',
      align: 'right',
      cell: (p) => (
        <Input
          value={String(p.cartaoPct).replace('.', ',')}
          onChange={(e) => setField(p.id, 'cartaoPct', Number(e.target.value.replace(',', '.')) || 0)}
          className="w-20 text-right"
        />
      ),
      nowrap: true,
    },
    {
      header: 'Boleto %',
      align: 'right',
      cell: (p) => (
        <Input
          value={String(p.boletoPct).replace('.', ',')}
          onChange={(e) => setField(p.id, 'boletoPct', Number(e.target.value.replace(',', '.')) || 0)}
          className="w-20 text-right"
        />
      ),
      nowrap: true,
    },
    {
      header: 'Antecip. %',
      align: 'right',
      cell: (p) => (
        <Input
          value={String(p.antecipacaoPct).replace('.', ',')}
          onChange={(e) => setField(p.id, 'antecipacaoPct', Number(e.target.value.replace(',', '.')) || 0)}
          className="w-20 text-right"
        />
      ),
      nowrap: true,
    },
    {
      header: 'Saque (R$)',
      align: 'right',
      cell: (p) => <span className="font-medium text-foreground">{formatCurrency(p.saqueFixo)}</span>,
      nowrap: true,
    },
    {
      header: '',
      align: 'right',
      cell: (p) =>
        p.default ? (
          <span className="text-xs text-faint">atual</span>
        ) : (
          <IconButton label="Definir como padrão" onClick={() => setDefault(p.id)}>
            <Star className="h-4 w-4" />
          </IconButton>
        ),
      nowrap: true,
    },
  ]

  return (
    <>
      <PageHeader
        title="Taxas & Planos"
        subtitle="Configure os planos de MDR aplicados aos sellers"
        actions={
          <Button onClick={() => setOpenNew(true)}>
            <Plus className="h-4 w-4" /> Novo plano
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Resumo em cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {plans.map((p) => (
            <div key={p.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-base font-bold text-foreground">{p.nome}</p>
                {p.default && (
                  <Badge tone="info">
                    <Star className="h-3 w-3" /> Padrão
                  </Badge>
                )}
              </div>
              <div className="mt-4 space-y-1.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted">Pix</span>
                  <span className="font-semibold text-foreground">{formatPercent(p.pixPct, 2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Cartão</span>
                  <span className="font-semibold text-foreground">{formatPercent(p.cartaoPct, 2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Boleto</span>
                  <span className="font-semibold text-foreground">{formatPercent(p.boletoPct, 2)}</span>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5 border-t border-border pt-3 text-xs text-muted">
                <Users className="h-3.5 w-3.5" /> {formatNumber(p.sellers)} sellers neste plano
              </div>
            </div>
          ))}
        </div>

        <SectionCard
          title="Planos de taxa"
          description="Edite os percentuais inline e marque o plano aplicado por padrão a novos sellers"
          action={
            <Button size="sm" onClick={() => toast('Alterações salvas')}>
              <Save className="h-4 w-4" /> Salvar alterações
            </Button>
          }
        >
          <DataTable
            columns={rateColumns}
            rows={plans}
            keyField={(p) => p.id}
            minWidth={820}
            emptyLabel="Nenhum plano cadastrado."
          />

          <div className="mt-6">
            <SubBlock title="O que é MDR?">
              <div className="flex gap-3 rounded-2xl border border-border bg-card-muted/30 p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Info className="h-4 w-4" />
                </span>
                <div className="space-y-2 text-sm text-muted">
                  <p>
                    O <span className="font-semibold text-foreground">MDR (Merchant Discount Rate)</span> é o percentual
                    descontado de cada transação aprovada, cobrado do seller pela intermediação do pagamento. Ele varia
                    por método: o Pix tem o menor custo, enquanto o cartão de crédito concentra as maiores taxas das
                    bandeiras e adquirentes.
                  </p>
                  <p>
                    Sobre antecipações de recebíveis incide a{' '}
                    <span className="font-semibold text-foreground">taxa de antecipação</span> ao mês, e cada saque tem
                    um <span className="font-semibold text-foreground">custo fixo</span> em reais. Ajuste com cautela: a
                    mudança vale para todos os sellers do plano.
                  </p>
                </div>
              </div>
            </SubBlock>
          </div>
        </SectionCard>
      </div>

      {/* Modal novo plano */}
      <Modal
        open={openNew}
        onClose={() => setOpenNew(false)}
        title="Novo plano de taxa"
        description="Defina os percentuais e o custo de saque do novo plano"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setOpenNew(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={createPlan}>
              Criar plano
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Nome do plano">
            <Input
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              placeholder="Ex.: Pro Black"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Taxa Pix (%)">
              <Input value={form.pixPct} onChange={(e) => setForm((f) => ({ ...f, pixPct: e.target.value }))} />
            </Field>
            <Field label="Taxa Cartão (%)">
              <Input value={form.cartaoPct} onChange={(e) => setForm((f) => ({ ...f, cartaoPct: e.target.value }))} />
            </Field>
            <Field label="Taxa Boleto (%)">
              <Input value={form.boletoPct} onChange={(e) => setForm((f) => ({ ...f, boletoPct: e.target.value }))} />
            </Field>
            <Field label="Antecipação (% a.m.)">
              <Input
                value={form.antecipacaoPct}
                onChange={(e) => setForm((f) => ({ ...f, antecipacaoPct: e.target.value }))}
              />
            </Field>
            <Field label="Saque fixo (R$)" className="col-span-2">
              <Input value={form.saqueFixo} onChange={(e) => setForm((f) => ({ ...f, saqueFixo: e.target.value }))} />
            </Field>
          </div>
        </div>
      </Modal>
    </>
  )
}
