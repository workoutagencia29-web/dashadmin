/* Changelog / notas de versão da plataforma (mock). */

export type ChangelogType = 'Novidade' | 'Melhoria' | 'Correção'

export interface ChangelogRelease {
  version: string
  date: Date
  tipo: ChangelogType
  titulo: string
  itens: string[]
}

export const changelog: ChangelogRelease[] = [
  {
    version: 'v2.14.0',
    date: new Date('2026-06-24T10:00:00'),
    tipo: 'Novidade',
    titulo: 'Cripto Gateway em produção',
    itens: [
      'Aceite de USDT, USDC e BTC com conversão instantânea para BRL.',
      'Novo método "Cripto" disponível nos filtros de transações e relatórios.',
      'Liquidação de cripto consolidada no extrato financeiro do seller.',
    ],
  },
  {
    version: 'v2.13.2',
    date: new Date('2026-06-17T09:30:00'),
    tipo: 'Correção',
    titulo: 'Ajustes na fila de saques',
    itens: [
      'Corrigido cálculo do valor pendente quando havia saques rejeitados no período.',
      'Tooltip de risco no drawer de saque deixou de truncar em telas estreitas.',
    ],
  },
  {
    version: 'v2.13.0',
    date: new Date('2026-06-09T14:00:00'),
    tipo: 'Melhoria',
    titulo: 'Antifraude Pro mais rápido',
    itens: [
      'Latência média do score reduzida de 180ms para 95ms.',
      'Novas regras adaptativas por segmento (Infoprodutos, E-commerce, SaaS).',
      'Painel de regras agora suporta simulação antes de publicar.',
    ],
  },
  {
    version: 'v2.12.1',
    date: new Date('2026-05-28T11:15:00'),
    tipo: 'Correção',
    titulo: 'Estabilidade de webhooks',
    itens: [
      'Retry exponencial passou a respeitar o limite máximo de 24h.',
      'Corrigida assinatura HMAC ausente em eventos de chargeback.',
    ],
  },
  {
    version: 'v2.12.0',
    date: new Date('2026-05-20T08:45:00'),
    tipo: 'Novidade',
    titulo: 'Moderação de produtos no Marketplace',
    itens: [
      'Nova área de Marketplace para auditar os produtos dos sellers.',
      'Pausar para análise, bloquear e excluir produtos direto do painel.',
      'Visão de faturamento por produto e status de afiliação.',
    ],
  },
  {
    version: 'v2.11.0',
    date: new Date('2026-05-06T16:20:00'),
    tipo: 'Melhoria',
    titulo: 'Dashboard de visão geral',
    itens: [
      'Filtro de período com presets e intervalo personalizado.',
      'Novo funil de aprovação com perda autorização→liquidação.',
      'Top sellers agora linkam direto para o detalhe do seller.',
    ],
  },
  {
    version: 'v2.10.1',
    date: new Date('2026-04-22T13:00:00'),
    tipo: 'Correção',
    titulo: 'Exportações e relatórios',
    itens: [
      'CSV de transações passou a respeitar os filtros aplicados na tela.',
      'Corrigido fuso horário nas datas exportadas em PDF.',
    ],
  },
  {
    version: 'v2.10.0',
    date: new Date('2026-04-10T10:30:00'),
    tipo: 'Novidade',
    titulo: 'Split de Pagamento',
    itens: [
      'Divisão automática de transações entre múltiplos recebedores.',
      'Regras por percentual ou valor fixo, com pré-visualização.',
      'Conciliação de splits no extrato de cada recebedor.',
    ],
  },
]
