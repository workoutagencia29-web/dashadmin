import { Badge, type BadgeTone } from './primitives'

/**
 * Mapa central de status → tom, cobrindo todos os domínios do admin
 * (transações, saques, KYC, MED, sellers, antecipações, reembolsos…).
 * Mantém as cores consistentes em todas as tabelas.
 */
const statusTone: Record<string, BadgeTone> = {
  // Transações / pagamentos
  Aprovado: 'success',
  Aprovada: 'success',
  Pago: 'success',
  Capturado: 'success',
  Pendente: 'warning',
  Processando: 'warning',
  'Aguardando Pagamento': 'warning',
  Recusado: 'danger',
  Recusada: 'danger',
  Negado: 'danger',
  Negada: 'danger',
  Falhou: 'danger',
  Expirado: 'neutral',
  Estornado: 'neutral',
  Reembolsado: 'neutral',
  Cancelado: 'danger',
  Cancelada: 'danger',
  Chargeback: 'danger',

  // MED / Disputas
  Aberta: 'warning',
  'Em Análise': 'warning',
  'Em Revisão': 'neutral',
  'Defesa Enviada': 'info',
  Contestada: 'info',
  Ganha: 'success',
  Perdida: 'danger',
  Acatada: 'neutral',
  Encerrada: 'neutral',

  // Saques / financeiro
  Concluído: 'success',
  Liberado: 'success',
  Solicitado: 'warning',
  'Em Processamento': 'warning',
  Rejeitado: 'danger',
  Bloqueado: 'danger',
  'Em Espera': 'neutral',

  // KYC / Sellers
  Aprovado_KYC: 'success',
  Verificado: 'success',
  Ativo: 'success',
  Ativa: 'success',
  'Em Análise KYC': 'warning',
  'Pendente Documentos': 'warning',
  'Sob Revisão': 'warning',
  Reprovado: 'danger',
  Suspenso: 'danger',
  Banido: 'danger',
  Inativo: 'neutral',
  'Em Onboarding': 'info',

  // Risco
  Baixo: 'success',
  Médio: 'warning',
  Alto: 'danger',
  Crítico: 'danger',

  // Assinaturas / produtos
  'Em Atraso': 'warning',
  Pausada: 'neutral',
  Pausado: 'neutral',
  Vencido: 'danger',
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={statusTone[status] ?? 'neutral'}>{status}</Badge>
}

/** Badge de nível de risco com bolinha. */
export function RiskBadge({ level }: { level: 'Baixo' | 'Médio' | 'Alto' | 'Crítico' }) {
  const tone = statusTone[level] ?? 'neutral'
  const dot = { Baixo: 'bg-success', Médio: 'bg-warning', Alto: 'bg-danger', Crítico: 'bg-danger' }[
    level
  ]
  return (
    <Badge tone={tone}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {level}
    </Badge>
  )
}

export function MethodBadge({ method }: { method: string }) {
  return <Badge tone="neutral">{method}</Badge>
}
