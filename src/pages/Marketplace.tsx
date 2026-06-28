import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  Package,
  ShoppingBag,
  Repeat,
  MoreVertical,
  Eye,
  Pause,
  Play,
  Ban,
  Trash2,
  Users,
  ExternalLink,
} from 'lucide-react'
import {
  PageHeader,
  SectionCard,
  SearchInput,
  MultiSelect,
  Select,
  StatusBadge,
  Badge,
  Avatar,
  Dropdown,
  Drawer,
  DetailRow,
  DrawerSection,
  Toolbar,
  StateTabs,
  ExportButtons,
  downloadCsv,
  Button,
  Switch,
} from '../components/ui'
import { useToast } from '../components/ui/Toast'
import {
  products as seedProducts,
  PRODUTO_CATEGORIAS,
  type MarketProduct,
  type ProdutoStatus,
} from '../data/marketplaceData'
import { formatCurrency, formatNumber, formatPercent } from '../lib/utils'
import { formatShort } from '../lib/date'

const TIPO_ICON = { Digital: Package, Físico: ShoppingBag, Assinatura: Repeat }

/* ------------------------------ capa do card ------------------------------ */

function Cover({ p }: { p: MarketProduct }) {
  const [err, setErr] = useState(false)
  const Icon = TIPO_ICON[p.tipo]
  if (!p.cover || err) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-faint">
        <Icon className="h-8 w-8" />
        <span className="text-xs">Sem imagem</span>
      </div>
    )
  }
  return (
    <img
      src={p.cover}
      alt={p.nome}
      loading="lazy"
      onError={() => setErr(true)}
      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
    />
  )
}

/* -------------------------------- card -------------------------------- */

interface CardProps {
  p: MarketProduct
  onOpen: (p: MarketProduct) => void
  onCheckout: (p: MarketProduct) => void
  menu: (p: MarketProduct) => { label: string; icon?: ReactNode; onClick?: () => void; tone?: 'default' | 'danger' }[]
}

function ProductCard({ p, onOpen, onCheckout, menu }: CardProps) {
  return (
    <div
      onClick={() => onOpen(p)}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:border-primary/40"
    >
      <div className="relative h-40 w-full overflow-hidden bg-card-muted">
        <Cover p={p} />
        <span className="absolute left-2 top-2 rounded-full bg-card/85 px-0.5 py-0.5 backdrop-blur-sm">
          <StatusBadge status={p.status} />
        </span>
        <span className="absolute right-2 top-2" onClick={(e) => e.stopPropagation()}>
          <Dropdown
            align="right"
            trigger={
              <button
                aria-label="Ações"
                className="rounded-lg bg-card/85 p-1.5 text-muted backdrop-blur-sm transition-colors hover:text-foreground"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            }
            items={menu(p)}
          />
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="truncate font-semibold text-foreground" title={p.nome}>
          {p.nome}
        </h3>
        <p className="mt-0.5 truncate text-xs text-faint">Ref: {p.ref}</p>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <Badge tone="success">{formatCurrency(p.preco)}</Badge>
          <Badge tone="neutral">{p.tipo}</Badge>
          {p.afiliados && (
            <Badge tone="info">
              <Users className="h-3 w-3" /> {p.comissaoAfiliado}%
            </Badge>
          )}
        </div>

        <div className="mt-3 flex items-center gap-2 border-t border-border/60 pt-3">
          <Avatar name={p.sellerName} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-foreground">{p.sellerName}</p>
            <p className="truncate text-[11px] tabular-nums text-muted">
              {formatNumber(p.vendas)} vendas · {formatCurrency(p.faturamento)}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <Button variant="outline" size="sm" className="w-full" onClick={(e) => { e.stopPropagation(); onOpen(p) }}>
            Ver detalhes
          </Button>
          <Button variant="ghost" size="sm" className="w-full" onClick={(e) => { e.stopPropagation(); onCheckout(p) }}>
            <ExternalLink className="h-3.5 w-3.5" /> Checkout
          </Button>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------- page -------------------------------- */

export default function Marketplace() {
  const { toast } = useToast()
  const [list, setList] = useState<MarketProduct[]>(seedProducts)
  const [query, setQuery] = useState('')
  const [cats, setCats] = useState<string[]>([])
  const [afiliado, setAfiliado] = useState('Todos')
  const [tab, setTab] = useState('Todos')
  const [selected, setSelected] = useState<MarketProduct | null>(null)

  function setStatus(id: string, status: ProdutoStatus, msg: string) {
    setList((l) => l.map((p) => (p.id === id ? { ...p, status } : p)))
    setSelected((s) => (s && s.id === id ? { ...s, status } : s))
    toast(msg)
  }
  function remove(id: string) {
    setList((l) => l.filter((p) => p.id !== id))
    setSelected(null)
    toast('Produto excluído', 'error')
  }
  function toggleAfiliados(id: string) {
    setList((l) => l.map((p) => (p.id === id ? { ...p, afiliados: !p.afiliados } : p)))
    setSelected((s) => (s && s.id === id ? { ...s, afiliados: !s.afiliados } : s))
    toast('Disponibilidade para afiliados atualizada')
  }
  function checkout(p: MarketProduct) {
    toast(`Abrindo checkout de "${p.nome}"…`, 'info')
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return list.filter((p) => {
      if (q && !`${p.nome} ${p.sellerName} ${p.sellerEmail} ${p.ref}`.toLowerCase().includes(q)) return false
      if (cats.length && !cats.includes(p.categoria)) return false
      if (afiliado === 'Sim' && !p.afiliados) return false
      if (afiliado === 'Não' && p.afiliados) return false
      if (tab !== 'Todos' && p.status !== tab) return false
      return true
    })
  }, [list, query, cats, afiliado, tab])

  const count = (s: ProdutoStatus) => list.filter((p) => p.status === s).length

  function menu(p: MarketProduct) {
    return [
      { label: 'Ver detalhes', icon: <Eye className="h-4 w-4" />, onClick: () => setSelected(p) },
      ...(p.status !== 'Ativo'
        ? [{ label: 'Reativar', icon: <Play className="h-4 w-4" />, onClick: () => setStatus(p.id, 'Ativo', 'Produto reativado') }]
        : []),
      ...(p.status !== 'Em Análise'
        ? [{ label: 'Pausar p/ análise', icon: <Pause className="h-4 w-4" />, onClick: () => setStatus(p.id, 'Em Análise', 'Produto em análise') }]
        : []),
      ...(p.status !== 'Bloqueado'
        ? [{ label: 'Bloquear', icon: <Ban className="h-4 w-4" />, tone: 'danger' as const, onClick: () => setStatus(p.id, 'Bloqueado', 'Produto bloqueado') }]
        : []),
      { label: 'Excluir', icon: <Trash2 className="h-4 w-4" />, tone: 'danger' as const, onClick: () => remove(p.id) },
    ]
  }

  function exportCsv() {
    downloadCsv(
      'produtos-marketplace.csv',
      ['Produto', 'Ref', 'Dono', 'E-mail', 'Categoria', 'Tipo', 'Preço', 'Vendas', 'Faturamento', 'Conversão %', 'Afiliados', 'Comissão %', 'Status'],
      filtered.map((p) => [p.nome, p.ref, p.sellerName, p.sellerEmail, p.categoria, p.tipo, p.preco, p.vendas, p.faturamento, p.conversao, p.afiliados ? 'Sim' : 'Não', p.comissaoAfiliado, p.status]),
    )
  }

  return (
    <>
      <PageHeader
        title="Marketplace"
        subtitle="Produtos cadastrados pelos sellers — clique num card para ver detalhes e moderar"
        actions={<ExportButtons formats={['CSV', 'PDF']} onCsv={exportCsv} />}
      />

      <div className="space-y-6">
        <SectionCard>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="info">{list.length} produtos</Badge>
              <Badge tone="neutral">{filtered.length} em exibição</Badge>
            </div>

            <StateTabs
              tabs={[
                { label: 'Todos', count: list.length },
                { label: 'Ativo', count: count('Ativo') },
                { label: 'Em Análise', count: count('Em Análise') },
                { label: 'Pausado', count: count('Pausado') },
                { label: 'Bloqueado', count: count('Bloqueado') },
              ]}
              active={tab}
              onChange={setTab}
            />

            <Toolbar
              left={
                <>
                  <SearchInput value={query} onChange={setQuery} placeholder="Buscar produto ou e-mail do seller" />
                  <MultiSelect label="Categoria" options={PRODUTO_CATEGORIAS} selected={cats} onChange={setCats} />
                  <Select value={afiliado} onChange={(e) => setAfiliado(e.target.value)} className="w-auto">
                    <option value="Todos">Afiliados: todos</option>
                    <option value="Sim">Com afiliados</option>
                    <option value="Não">Sem afiliados</option>
                  </Select>
                </>
              }
            />
          </div>
        </SectionCard>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card py-16 text-center text-sm text-muted">
            Nenhum produto para os filtros.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} p={p} onOpen={setSelected} onCheckout={checkout} menu={menu} />
            ))}
          </div>
        )}
      </div>

      {/* Drawer de detalhe / moderação */}
      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.nome ?? ''}
        subtitle={selected ? `${selected.tipo} · ${selected.categoria}` : ''}
        width="lg"
        footer={
          selected && (
            <div className="flex flex-wrap gap-2">
              {selected.status !== 'Ativo' && (
                <Button variant="success" size="sm" className="flex-1" onClick={() => setStatus(selected.id, 'Ativo', 'Produto reativado')}>
                  <Play className="h-4 w-4" /> Reativar
                </Button>
              )}
              {selected.status !== 'Em Análise' && (
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setStatus(selected.id, 'Em Análise', 'Produto em análise')}>
                  <Pause className="h-4 w-4" /> Análise
                </Button>
              )}
              {selected.status !== 'Bloqueado' && (
                <Button variant="danger" size="sm" className="flex-1" onClick={() => setStatus(selected.id, 'Bloqueado', 'Produto bloqueado')}>
                  <Ban className="h-4 w-4" /> Bloquear
                </Button>
              )}
              <Button variant="danger" size="sm" className="flex-1" onClick={() => remove(selected.id)}>
                <Trash2 className="h-4 w-4" /> Excluir
              </Button>
            </div>
          )
        }
      >
        {selected && (
          <>
            <div className="mb-5 h-40 w-full overflow-hidden rounded-2xl bg-card-muted">
              <Cover p={selected} />
            </div>

            <div className="mb-6 flex items-center justify-between rounded-2xl border border-border bg-card-muted/40 p-4">
              <div>
                <p className="text-xs text-muted">Faturamento do produto</p>
                <p className="text-2xl font-bold tabular-nums text-foreground">{formatCurrency(selected.faturamento)}</p>
                <p className="mt-0.5 text-xs text-muted">{formatNumber(selected.vendas)} vendas</p>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <DrawerSection title="Produto">
              <DetailRow label="Nome" value={selected.nome} />
              <DetailRow label="Ref" value={<span className="font-mono text-xs">{selected.ref}</span>} />
              <DetailRow label="Tipo" value={selected.tipo} />
              <DetailRow label="Categoria" value={selected.categoria} />
              <DetailRow label="Preço" value={formatCurrency(selected.preco)} />
              <DetailRow label="Criado em" value={formatShort(selected.criadoEm)} />
            </DrawerSection>

            <DrawerSection title="Dono (seller)">
              <Link
                to={`/sellers/${selected.sellerId}`}
                className="flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-card-muted/50"
              >
                <Avatar name={selected.sellerName} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{selected.sellerName}</p>
                  <p className="truncate text-xs text-muted">{selected.sellerEmail}</p>
                </div>
              </Link>
            </DrawerSection>

            <DrawerSection title="Desempenho">
              <DetailRow label="Vendas" value={formatNumber(selected.vendas)} />
              <DetailRow label="Faturamento" value={formatCurrency(selected.faturamento)} />
              <DetailRow label="Conversão" value={formatPercent(selected.conversao)} />
              <DetailRow label="Reembolso" value={formatPercent(selected.reembolsoRate)} />
            </DrawerSection>

            <DrawerSection title="Afiliação">
              <div className="flex items-center justify-between rounded-xl border border-border p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Disponível para afiliados</p>
                  <p className="text-xs text-muted">
                    {selected.afiliados
                      ? `Comissão de ${selected.comissaoAfiliado}% por venda`
                      : 'Produto sem programa de afiliados'}
                  </p>
                </div>
                <Switch checked={selected.afiliados} onChange={() => toggleAfiliados(selected.id)} />
              </div>
            </DrawerSection>

            <div className="mt-5">
              <Button variant="outline" className="w-full" onClick={() => checkout(selected)}>
                <ExternalLink className="h-4 w-4" /> Abrir checkout do produto
              </Button>
            </div>
          </>
        )}
      </Drawer>
    </>
  )
}
