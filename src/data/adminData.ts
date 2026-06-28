/* Dados mock do módulo de Administração: usuários internos, papéis,
   matriz de permissões e trilha de auditoria. Geração determinística. */

import { addDays } from '../lib/date'
import { mulberry32, hashStr, pick, randInt } from '../lib/rng'

/* ------------------------------ Usuários ----------------------------- */

export type AdminRole = 'Super Admin' | 'Financeiro' | 'Suporte' | 'Risco' | 'Somente leitura'
export type AdminStatus = 'Ativo' | 'Inativo'

export interface AdminUser {
  id: string
  name: string
  email: string
  role: AdminRole
  status: AdminStatus
  ultimoAcesso: Date
  criadoEm: Date
}

export const ADMIN_ROLES: AdminRole[] = [
  'Super Admin',
  'Financeiro',
  'Suporte',
  'Risco',
  'Somente leitura',
]

interface AdminSeed {
  name: string
  email: string
  role: AdminRole
  status: AdminStatus
  acessoHoras: number // horas atrás do último acesso
  criadoDias: number // dias atrás da criação da conta
}

const ADMIN_SEEDS: AdminSeed[] = [
  { name: 'Pedro Costa', email: 'pedro.costa@nummo.com.br', role: 'Super Admin', status: 'Ativo', acessoHoras: 0, criadoDias: 720 },
  { name: 'Mariana Lopes', email: 'mariana.lopes@nummo.com.br', role: 'Financeiro', status: 'Ativo', acessoHoras: 2, criadoDias: 540 },
  { name: 'Rafael Andrade', email: 'rafael.andrade@nummo.com.br', role: 'Risco', status: 'Ativo', acessoHoras: 5, criadoDias: 410 },
  { name: 'Carolina Dias', email: 'carolina.dias@nummo.com.br', role: 'Suporte', status: 'Ativo', acessoHoras: 26, criadoDias: 295 },
  { name: 'Lucas Moreira', email: 'lucas.moreira@nummo.com.br', role: 'Financeiro', status: 'Ativo', acessoHoras: 9, criadoDias: 260 },
  { name: 'Beatriz Nunes', email: 'beatriz.nunes@nummo.com.br', role: 'Suporte', status: 'Inativo', acessoHoras: 1080, criadoDias: 380 },
  { name: 'Thiago Ramos', email: 'thiago.ramos@nummo.com.br', role: 'Risco', status: 'Ativo', acessoHoras: 31, criadoDias: 175 },
  { name: 'Aline Cardoso', email: 'aline.cardoso@nummo.com.br', role: 'Somente leitura', status: 'Ativo', acessoHoras: 72, criadoDias: 88 },
]

export const adminUsers: AdminUser[] = (() => {
  const now = new Date()
  return ADMIN_SEEDS.map((s, i) => ({
    id: `adm_${String(i + 1).padStart(3, '0')}`,
    name: s.name,
    email: s.email,
    role: s.role,
    status: s.status,
    ultimoAcesso: new Date(now.getTime() - s.acessoHoras * 3_600_000),
    criadoEm: addDays(now, -s.criadoDias),
  }))
})()

/* ------------------------------- Papéis ------------------------------ */

export interface Role {
  id: string
  nome: AdminRole
  descricao: string
  membros: number
}

export const roles: Role[] = ADMIN_ROLES.map((nome) => {
  const descricoes: Record<AdminRole, string> = {
    'Super Admin': 'Acesso irrestrito a todos os módulos e configurações da plataforma.',
    Financeiro: 'Gestão de saques, antecipações, reservas e relatórios financeiros.',
    Suporte: 'Atendimento a sellers, consulta de transações e abertura de chamados.',
    Risco: 'Análise antifraude, KYC, blocklist e disputas MED.',
    'Somente leitura': 'Visualização de painéis e relatórios, sem permissão de edição.',
  }
  return {
    id: `role_${nome.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]+/g, '_')}`,
    nome,
    descricao: descricoes[nome],
    membros: adminUsers.filter((u) => u.role === nome).length,
  }
})

/* ------------------------- Matriz de permissões ---------------------- */

export type PermissionLevel = 'Nenhum' | 'Ver' | 'Editar' | 'Total'

export const modules: string[] = [
  'Transações',
  'Sellers',
  'Financeiro',
  'Saques',
  'Risco',
  'Gateway',
  'Clientes',
  'Admin',
]

/** Nível de acesso por módulo, para cada papel. */
export const permissionMatrix: Record<AdminRole, Record<string, PermissionLevel>> = {
  'Super Admin': {
    Transações: 'Total',
    Sellers: 'Total',
    Financeiro: 'Total',
    Saques: 'Total',
    Risco: 'Total',
    Gateway: 'Total',
    Clientes: 'Total',
    Admin: 'Total',
  },
  Financeiro: {
    Transações: 'Ver',
    Sellers: 'Ver',
    Financeiro: 'Total',
    Saques: 'Total',
    Risco: 'Nenhum',
    Gateway: 'Ver',
    Clientes: 'Ver',
    Admin: 'Nenhum',
  },
  Suporte: {
    Transações: 'Editar',
    Sellers: 'Editar',
    Financeiro: 'Ver',
    Saques: 'Ver',
    Risco: 'Ver',
    Gateway: 'Nenhum',
    Clientes: 'Editar',
    Admin: 'Nenhum',
  },
  Risco: {
    Transações: 'Editar',
    Sellers: 'Editar',
    Financeiro: 'Nenhum',
    Saques: 'Ver',
    Risco: 'Total',
    Gateway: 'Ver',
    Clientes: 'Ver',
    Admin: 'Nenhum',
  },
  'Somente leitura': {
    Transações: 'Ver',
    Sellers: 'Ver',
    Financeiro: 'Ver',
    Saques: 'Ver',
    Risco: 'Ver',
    Gateway: 'Ver',
    Clientes: 'Ver',
    Admin: 'Nenhum',
  },
}

/* ------------------------- Trilha de auditoria ----------------------- */

export type LogTone = 'info' | 'warning' | 'danger'

export interface AuditLog {
  id: string
  actor: string
  action: string
  target: string
  ip: string
  date: Date
  tone: LogTone
}

interface ActionTemplate {
  action: string
  tone: LogTone
  targets: string[]
}

const ACTION_TEMPLATES: ActionTemplate[] = [
  { action: 'Aprovou saque', tone: 'info', targets: ['Saque #SQ-4821', 'Saque #SQ-4830', 'Saque #SQ-4855'] },
  { action: 'Reprovou saque', tone: 'warning', targets: ['Saque #SQ-4799', 'Saque #SQ-4812'] },
  { action: 'Aprovou KYC', tone: 'info', targets: ['MentoriaPro', 'FitMeals Delivery', 'Code Bootcamp'] },
  { action: 'Reprovou KYC', tone: 'warning', targets: ['Pet Shop Express', 'Beleza Natural Shop'] },
  { action: 'Alterou taxa MDR', tone: 'warning', targets: ['Plano Pro', 'Plano Starter', 'CloudSaaS BR'] },
  { action: 'Bloqueou seller', tone: 'danger', targets: ['Pet Shop Express', 'Beleza Natural Shop'] },
  { action: 'Suspendeu seller', tone: 'danger', targets: ['Trader Academy', 'Loja Prime Wear'] },
  { action: 'Adicionou à blocklist', tone: 'danger', targets: ['CPF 412.***.***-09', 'IP 187.61.40.12', 'Cartão ****4821'] },
  { action: 'Login no painel', tone: 'info', targets: ['Sessão web', 'Sessão web · 2FA'] },
  { action: 'Tentativa de login falha', tone: 'warning', targets: ['Sessão web', 'Sessão API'] },
  { action: 'Exportou relatório', tone: 'info', targets: ['Relatório financeiro', 'Relatório de transações', 'Conciliação OFX'] },
  { action: 'Forçou estorno', tone: 'danger', targets: ['Transação #TX-90142', 'Transação #TX-90188'] },
  { action: 'Aprovou antecipação', tone: 'info', targets: ['Antecipação #AN-3201', 'Antecipação #AN-3218'] },
  { action: 'Editou webhook', tone: 'warning', targets: ['Endpoint pagamentos', 'Endpoint reembolsos'] },
  { action: 'Convidou administrador', tone: 'info', targets: ['novo@nummo.com.br', 'analista@nummo.com.br'] },
  { action: 'Desativou administrador', tone: 'warning', targets: ['beatriz.nunes@nummo.com.br'] },
  { action: 'Alterou permissões', tone: 'danger', targets: ['Papel Suporte', 'Papel Financeiro'] },
  { action: 'Liberou reserva', tone: 'info', targets: ['Reserva #RS-1102', 'Reserva #RS-1140'] },
]

function buildAuditLogs(n: number): AuditLog[] {
  const rnd = mulberry32(hashStr('admin-audit-nummo'))
  const actors = adminUsers.map((u) => u.name)
  const now = new Date()
  const out: AuditLog[] = []
  let cursor = now.getTime()
  for (let i = 0; i < n; i++) {
    const tpl = pick(ACTION_TEMPLATES, rnd)
    cursor -= randInt(rnd, 18, 240) * 60_000 // intervalos de 18min a 4h
    out.push({
      id: `log_${String(n - i).padStart(4, '0')}`,
      actor: pick(actors, rnd),
      action: tpl.action,
      target: pick(tpl.targets, rnd),
      ip: `${randInt(rnd, 177, 201)}.${randInt(rnd, 10, 250)}.${randInt(rnd, 1, 250)}.${randInt(rnd, 1, 250)}`,
      date: new Date(cursor),
      tone: tpl.tone,
    })
  }
  return out
}

export const auditLogs: AuditLog[] = buildAuditLogs(30)

/** Lista de ações distintas (para popular o filtro da página de logs). */
export const auditActions: string[] = Array.from(new Set(ACTION_TEMPLATES.map((t) => t.action)))
