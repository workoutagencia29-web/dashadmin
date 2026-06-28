import {
  LayoutDashboard,
  ArrowLeftRight,
  Store,
  Wallet,
  ShieldAlert,
  SlidersHorizontal,
  Users,
  UserCog,
  FileSpreadsheet,
  Blocks,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

export interface NavChild {
  label: string
  path: string
}

export interface NavItem {
  label: string
  icon: LucideIcon
  /** Link direto (itens sem submenu). */
  path?: string
  /** Submenu expansível. */
  children?: NavChild[]
  /** Item desabilitado (ex: "Em Breve"). */
  disabled?: boolean
  /** Selo ao lado do label. */
  badge?: string
}

export const navItems: NavItem[] = [
  { label: 'Visão Geral', icon: LayoutDashboard, path: '/' },
  {
    label: 'Transações',
    icon: ArrowLeftRight,
    children: [
      { label: 'Pagamentos', path: '/transacoes' },
      { label: 'MED & Chargebacks', path: '/transacoes/med' },
      { label: 'Reembolsos', path: '/transacoes/reembolsos' },
    ],
  },
  {
    label: 'Sellers',
    icon: Store,
    children: [
      { label: 'Todos os Sellers', path: '/sellers' },
      { label: 'KYC & Aprovação', path: '/sellers/kyc' },
    ],
  },
  {
    label: 'Financeiro',
    icon: Wallet,
    children: [
      { label: 'Visão da Plataforma', path: '/financeiro' },
      { label: 'Saques', path: '/financeiro/saques' },
      { label: 'Antecipações', path: '/financeiro/antecipacoes' },
      { label: 'Reservas', path: '/financeiro/reservas' },
    ],
  },
  {
    label: 'Relatórios',
    icon: FileSpreadsheet,
    children: [
      { label: 'Consolidação (DRE)', path: '/relatorios/consolidacao' },
      { label: 'Conciliação', path: '/relatorios/conciliacao' },
    ],
  },
  {
    label: 'Risco & Antifraude',
    icon: ShieldAlert,
    children: [
      { label: 'Antifraude', path: '/risco/antifraude' },
      { label: 'Blocklist', path: '/risco/blocklist' },
    ],
  },
  {
    label: 'Gateway',
    icon: SlidersHorizontal,
    children: [
      { label: 'Taxas & Planos', path: '/gateway/taxas' },
      { label: 'Adquirentes & Roteamento', path: '/gateway/adquirentes' },
      { label: 'Métodos de Pagamento', path: '/gateway/metodos' },
      { label: 'Webhooks & API', path: '/gateway/webhooks' },
    ],
  },
  { label: 'Clientes', icon: Users, path: '/clientes' },
  { label: 'Marketplace', icon: Blocks, path: '/marketplace' },
  {
    label: 'Administração',
    icon: UserCog,
    children: [
      { label: 'Administradores', path: '/admin/usuarios' },
      { label: 'Permissões', path: '/admin/permissoes' },
      { label: 'Logs & Auditoria', path: '/admin/logs' },
    ],
  },
  { label: 'Atualizações', icon: Sparkles, path: '/atualizacoes' },
]
