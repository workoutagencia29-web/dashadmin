/* Marketplace = vitrine de PRODUTOS dos sellers, para o admin auditar/moderar.
   Determinístico (mulberry32/hashStr), semeado por seller+produto. */

import { mulberry32, hashStr, pick, randInt } from '../lib/rng'
import { addDays } from '../lib/date'
import { sellers } from './shared'

export type ProdutoStatus = 'Ativo' | 'Em Análise' | 'Pausado' | 'Bloqueado'
export type ProdutoTipo = 'Digital' | 'Físico' | 'Assinatura'

export interface MarketProduct {
  id: string
  ref: string // código de referência curto
  nome: string
  sellerId: string
  sellerName: string
  sellerEmail: string
  categoria: string // segmento do seller
  tipo: ProdutoTipo
  preco: number
  cover: string // URL da imagem de capa ('' = sem imagem)
  status: ProdutoStatus
  afiliados: boolean
  comissaoAfiliado: number // % (0 se não disponível p/ afiliados)
  vendas: number
  faturamento: number
  conversao: number // %
  reembolsoRate: number // %
  criadoEm: Date
}

const REF_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
function refCode(rnd: () => number): string {
  let s = ''
  for (let i = 0; i < 22; i++) s += REF_CHARS[Math.floor(rnd() * REF_CHARS.length)]
  return s
}

export const PRODUTO_STATUSES: ProdutoStatus[] = ['Ativo', 'Em Análise', 'Pausado', 'Bloqueado']

const TEMPLATES: Record<string, string[]> = {
  Infoprodutos: ['Curso Tráfego Pago 360', 'Mentoria Escala Digital', 'Masterclass de Copywriting', 'Método Lançamento Perfeito', 'Comunidade VIP Marketing'],
  Educação: ['Curso Completo de Inglês', 'Trilha Full-Stack', 'Prep ENEM Intensivo', 'Workshop de Finanças', 'Bootcamp de Dados'],
  'E-commerce': ['Kit Skincare Premium', 'Combo Suplementos 90d', 'Tênis Runner Pro', 'Camiseta Oversized Drop', 'Caixa Surpresa Mensal'],
  SaaS: ['Plano Pro Mensal', 'Licença Enterprise', 'Add-on Analytics', 'Plano Starter Anual'],
  Serviços: ['Consultoria Express', 'Pacote de Design Completo', 'Plano Delivery Fit', 'Assessoria de Tráfego'],
  Saúde: ['Protocolo Emagrecimento', 'Telemedicina Plus', 'Programa 90 Dias', 'Consulta + Plano Alimentar'],
  Assinaturas: ['Box Mensal Premium', 'Clube de Assinatura', 'Plano Anual Gold'],
}

const TIPO_BY_SEG: Record<string, ProdutoTipo> = {
  Infoprodutos: 'Digital',
  Educação: 'Digital',
  'E-commerce': 'Físico',
  SaaS: 'Assinatura',
  Serviços: 'Digital',
  Saúde: 'Digital',
  Assinaturas: 'Assinatura',
}

const PRECOS: Record<ProdutoTipo, number[]> = {
  Digital: [47, 97, 197, 297, 497, 997, 1497, 1997],
  Físico: [49.9, 89.9, 129.9, 159.9, 249.9, 349.9],
  Assinatura: [19.9, 39.9, 59.9, 99.9, 199, 299],
}

function buildProducts(): MarketProduct[] {
  const out: MarketProduct[] = []
  for (const s of sellers) {
    const rnd = mulberry32(hashStr('prod-' + s.id))
    const pool = [...(TEMPLATES[s.segment] ?? TEMPLATES['Infoprodutos'])]
    const n = Math.min(pool.length, randInt(rnd, 1, 3))
    for (let i = 0; i < n; i++) {
      const nome = pool.splice(Math.floor(rnd() * pool.length), 1)[0]
      const tipo = TIPO_BY_SEG[s.segment] ?? 'Digital'
      const preco = pick(PRECOS[tipo], rnd)

      // status segue a situação do seller, com variação
      let status: ProdutoStatus
      if (s.status === 'Banido') status = 'Bloqueado'
      else if (s.status === 'Suspenso') status = rnd() > 0.5 ? 'Pausado' : 'Bloqueado'
      else if (s.status === 'Em Análise KYC' || s.status === 'Em Onboarding') status = 'Em Análise'
      else {
        const r = rnd()
        status = r > 0.86 ? 'Em Análise' : r > 0.78 ? 'Pausado' : 'Ativo'
      }

      const ativo = status === 'Ativo'
      const vendas = ativo ? randInt(rnd, 40, 2600) : randInt(rnd, 0, 180)
      const afiliados = rnd() > 0.42
      const cover = rnd() > 0.9 ? '' : `https://picsum.photos/seed/nummo${hashStr(s.id + i)}/600/360`
      out.push({
        id: `prod_${s.id}_${i}`,
        ref: refCode(rnd),
        nome,
        sellerId: s.id,
        sellerName: s.name,
        sellerEmail: s.email,
        categoria: s.segment,
        tipo,
        preco,
        cover,
        status,
        afiliados,
        comissaoAfiliado: afiliados ? randInt(rnd, 20, 60) : 0,
        vendas,
        faturamento: Math.round(vendas * preco),
        conversao: +(1.4 + rnd() * 8.2).toFixed(1),
        reembolsoRate: +(rnd() * 4).toFixed(1),
        criadoEm: addDays(new Date(), -randInt(rnd, 6, 520)),
      })
    }
  }
  return out.sort((a, b) => b.faturamento - a.faturamento)
}

export const products: MarketProduct[] = buildProducts()

/** Categorias (segmentos) presentes nos produtos. */
export const PRODUTO_CATEGORIAS: string[] = Array.from(new Set(products.map((p) => p.categoria))).sort()
