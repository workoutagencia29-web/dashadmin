/* Pools e entidades compartilhadas entre páginas do admin (mock). */

export const PAYMENT_METHODS = ['Pix', 'Cartão de Crédito', 'Boleto', 'Cartão de Débito', 'Cripto'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const ACQUIRERS = ['Cielo', 'Rede', 'Stone', 'Adyen', 'Pagar.me'] as const
export type Acquirer = (typeof ACQUIRERS)[number]

export const CARD_BRANDS = ['Visa', 'Mastercard', 'Elo', 'Amex', 'Hipercard'] as const

/** Sellers/lojas da plataforma — referenciados por transações, saques, KYC etc. */
export interface Seller {
  id: string
  name: string
  legalName: string
  document: string // CNPJ/CPF
  email: string
  segment: string
  status: 'Ativo' | 'Suspenso' | 'Em Análise KYC' | 'Banido' | 'Em Onboarding'
  risk: 'Baixo' | 'Médio' | 'Alto'
  mrr: number
  volume30d: number
  approvalRate: number
  chargebackRate: number
  joinedDays: number // dias atrás
}

export const SEGMENTS = [
  'Infoprodutos',
  'E-commerce',
  'SaaS',
  'Serviços',
  'Educação',
  'Saúde',
  'Assinaturas',
]

export const sellers: Seller[] = [
  { id: 'sl_001', name: 'Workout Agência', legalName: 'Workout Marketing LTDA', document: '42.518.300/0001-77', email: 'fin@workout.com.br', segment: 'Infoprodutos', status: 'Ativo', risk: 'Baixo', mrr: 184200, volume30d: 982400, approvalRate: 93.2, chargebackRate: 0.42, joinedDays: 412 },
  { id: 'sl_002', name: 'Studio Hipertrofia', legalName: 'Hipertrofia Digital ME', document: '31.902.114/0001-09', email: 'contato@hipertrofia.app', segment: 'Educação', status: 'Ativo', risk: 'Baixo', mrr: 96800, volume30d: 540300, approvalRate: 91.5, chargebackRate: 0.61, joinedDays: 298 },
  { id: 'sl_003', name: 'Loja Prime Wear', legalName: 'Prime Wear Comércio LTDA', document: '28.443.901/0001-55', email: 'adm@primewear.com', segment: 'E-commerce', status: 'Ativo', risk: 'Médio', mrr: 142500, volume30d: 763900, approvalRate: 88.1, chargebackRate: 1.34, joinedDays: 211 },
  { id: 'sl_004', name: 'MentoriaPro', legalName: 'Mentoria Pro Cursos LTDA', document: '40.118.762/0001-30', email: 'pay@mentoriapro.com', segment: 'Infoprodutos', status: 'Em Análise KYC', risk: 'Médio', mrr: 0, volume30d: 0, approvalRate: 0, chargebackRate: 0, joinedDays: 4 },
  { id: 'sl_005', name: 'CloudSaaS BR', legalName: 'CloudSaaS Tecnologia S.A.', document: '19.776.500/0001-12', email: 'billing@cloudsaas.com.br', segment: 'SaaS', status: 'Ativo', risk: 'Baixo', mrr: 211400, volume30d: 1180000, approvalRate: 94.8, chargebackRate: 0.28, joinedDays: 540 },
  { id: 'sl_006', name: 'Beleza Natural Shop', legalName: 'Beleza Natural Cosméticos ME', document: '33.221.008/0001-44', email: 'financeiro@belezanatural.shop', segment: 'E-commerce', status: 'Suspenso', risk: 'Alto', mrr: 38900, volume30d: 142000, approvalRate: 79.4, chargebackRate: 3.12, joinedDays: 96 },
  { id: 'sl_007', name: 'Dr. Saúde Online', legalName: 'Saúde Online Telemedicina LTDA', document: '22.901.733/0001-61', email: 'pagamentos@drsaude.com', segment: 'Saúde', status: 'Ativo', risk: 'Baixo', mrr: 124000, volume30d: 631200, approvalRate: 92.7, chargebackRate: 0.39, joinedDays: 365 },
  { id: 'sl_008', name: 'Trader Academy', legalName: 'Trader Academy Educação LTDA', document: '37.554.210/0001-88', email: 'fin@traderacademy.com', segment: 'Educação', status: 'Ativo', risk: 'Alto', mrr: 88300, volume30d: 498700, approvalRate: 84.6, chargebackRate: 2.07, joinedDays: 158 },
  { id: 'sl_009', name: 'Box Assinaturas', legalName: 'Box Mensal Assinaturas LTDA', document: '29.330.991/0001-23', email: 'adm@boxassinaturas.com', segment: 'Assinaturas', status: 'Ativo', risk: 'Médio', mrr: 67500, volume30d: 312800, approvalRate: 89.9, chargebackRate: 0.94, joinedDays: 187 },
  { id: 'sl_010', name: 'FitMeals Delivery', legalName: 'FitMeals Alimentação LTDA', document: '41.002.554/0001-70', email: 'pay@fitmeals.com.br', segment: 'Serviços', status: 'Em Onboarding', risk: 'Médio', mrr: 0, volume30d: 0, approvalRate: 0, chargebackRate: 0, joinedDays: 1 },
  { id: 'sl_011', name: 'Code Bootcamp', legalName: 'Code Bootcamp Tech LTDA', document: '38.776.012/0001-05', email: 'billing@codebootcamp.dev', segment: 'Educação', status: 'Ativo', risk: 'Baixo', mrr: 103200, volume30d: 587000, approvalRate: 93.9, chargebackRate: 0.33, joinedDays: 274 },
  { id: 'sl_012', name: 'Pet Shop Express', legalName: 'Pet Express Comércio ME', document: '30.554.778/0001-90', email: 'financeiro@petexpress.com', segment: 'E-commerce', status: 'Banido', risk: 'Alto', mrr: 0, volume30d: 0, approvalRate: 71.2, chargebackRate: 5.41, joinedDays: 132 },
]

/** Primeiros nomes / sobrenomes para gerar clientes/compradores mock. */
export const FIRST_NAMES = [
  'Ana', 'Bruno', 'Carla', 'Diego', 'Eduarda', 'Felipe', 'Gabriela', 'Henrique',
  'Isabela', 'João', 'Larissa', 'Marcos', 'Natália', 'Otávio', 'Paula', 'Rafael',
  'Sofia', 'Thiago', 'Vanessa', 'William', 'Beatriz', 'Lucas', 'Mariana', 'Pedro',
]
export const LAST_NAMES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Pereira', 'Costa', 'Almeida',
  'Ferreira', 'Rodrigues', 'Gomes', 'Martins', 'Araújo', 'Barbosa', 'Ribeiro', 'Carvalho',
]

export const sellerById = (id: string) => sellers.find((s) => s.id === id)
