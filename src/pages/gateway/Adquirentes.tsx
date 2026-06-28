import { useMemo, useState } from 'react'
import { Save, ArrowUp, ArrowDown, Network, Gauge, Timer } from 'lucide-react'
import {
  PageHeader,
  SectionCard,
  Button,
  IconButton,
  Switch,
  Badge,
  ProgressBar,
} from '../../components/ui'
import { BarsChart } from '../../components/charts/Charts'
import { useToast } from '../../components/ui/Toast'
import { acquirers, type AcquirerConfig } from '../../data/gatewayData'
import { formatPercent } from '../../lib/utils'

export default function Adquirentes() {
  const { toast } = useToast()
  const [routes, setRoutes] = useState<AcquirerConfig[]>(acquirers)

  function toggleAtivo(id: string) {
    setRoutes((prev) => prev.map((a) => (a.id === id ? { ...a, ativo: !a.ativo } : a)))
  }

  function move(index: number, dir: -1 | 1) {
    setRoutes((prev) => {
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next.map((a, i) => ({ ...a, prioridade: i + 1 }))
    })
  }

  const ativos = routes.filter((a) => a.ativo)

  // Taxa combinada da cascata: 1 - produto(1 - aprovacao/100) dos ativos.
  const cascataPct = useMemo(() => {
    if (!ativos.length) return 0
    const falha = ativos.reduce((acc, a) => acc * (1 - a.aprovacao / 100), 1)
    return (1 - falha) * 100
  }, [ativos])

  const custoMedio = useMemo(() => {
    if (!ativos.length) return 0
    const totalPeso = ativos.reduce((s, a) => s + a.peso, 0) || ativos.length
    const ponderado = ativos.reduce((s, a) => s + a.custo * (a.peso || 1), 0)
    return ponderado / totalPeso
  }, [ativos])

  const chartData = routes.map((a) => ({
    label: a.nome,
    Aprovação: a.aprovacao,
    Custo: a.custo,
  }))

  return (
    <>
      <PageHeader
        title="Adquirentes & Roteamento"
        subtitle="Cascata inteligente de processamento por adquirente"
        actions={
          <Button onClick={() => toast('Roteamento salvo')}>
            <Save className="h-4 w-4" /> Salvar roteamento
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Destaques */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-sm text-muted">
              <Network className="h-4 w-4" /> Taxa combinada da cascata
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight text-success">{formatPercent(cascataPct, 2)}</p>
            <p className="mt-1 text-xs text-faint">
              Probabilidade de aprovação considerando {ativos.length} adquirente(s) ativo(s) em cascata
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-sm text-muted">
              <Gauge className="h-4 w-4" /> Custo médio ponderado
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight text-foreground">{formatPercent(custoMedio, 2)}</p>
            <p className="mt-1 text-xs text-faint">Média do custo por peso de roteamento dos ativos</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-sm text-muted">
              <Timer className="h-4 w-4" /> Adquirentes ativos
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight text-foreground">
              {ativos.length}
              <span className="text-lg text-muted"> / {routes.length}</span>
            </p>
            <p className="mt-1 text-xs text-faint">Tentativas seguem a ordem de prioridade definida abaixo</p>
          </div>
        </div>

        <SectionCard
          title="Roteamento inteligente"
          description="Ative, ajuste o peso e ordene a prioridade de cada adquirente na cascata"
        >
          <div className="space-y-3">
            {routes.map((a, i) => (
              <div
                key={a.id}
                className="flex flex-col gap-4 rounded-2xl border border-border bg-card-muted/30 p-4 lg:flex-row lg:items-center"
              >
                <div className="flex items-center gap-3 lg:w-56">
                  <div className="flex flex-col">
                    <IconButton
                      label="Subir prioridade"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      className="disabled:opacity-30"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </IconButton>
                    <IconButton
                      label="Descer prioridade"
                      onClick={() => move(i, 1)}
                      disabled={i === routes.length - 1}
                      className="disabled:opacity-30"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </IconButton>
                  </div>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-sm font-bold text-foreground">
                    {a.prioridade}
                  </span>
                  <div>
                    <p className="font-semibold text-foreground">{a.nome}</p>
                    <p className="text-xs text-muted">{a.latenciaMs} ms latência</p>
                  </div>
                </div>

                <div className="flex-1">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-muted">Peso de roteamento</span>
                    <span className="font-semibold text-foreground">{a.peso}%</span>
                  </div>
                  <ProgressBar value={a.peso} tone={a.ativo ? 'primary' : 'warning'} />
                </div>

                <div className="flex items-center gap-2">
                  <Badge tone="success">{formatPercent(a.aprovacao)} aprov.</Badge>
                  <Badge tone="neutral">{formatPercent(a.custo, 2)} custo</Badge>
                </div>

                <div className="flex items-center gap-2 lg:w-28 lg:justify-end">
                  <span className="text-xs text-muted">{a.ativo ? 'Ativo' : 'Inativo'}</span>
                  <Switch checked={a.ativo} onChange={() => toggleAtivo(a.id)} />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Aprovação vs. custo" description="Comparativo por adquirente (% de aprovação e % de custo)">
          <BarsChart
            data={chartData}
            height={300}
            valueFormatter={(v) => formatPercent(v, 2)}
            series={[
              { key: 'Aprovação', name: 'Aprovação', color: '#10b981' },
              { key: 'Custo', name: 'Custo', color: '#f43f5e' },
            ]}
          />
        </SectionCard>
      </div>
    </>
  )
}
