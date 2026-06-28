# Nummo Admin — Painel do Gateway

Painel administrativo (super-admin) do gateway de pagamentos **Nummo**. Companheiro do
painel do vendedor ([`dashseller`](https://github.com/workoutagencia29-web/dashseller)) e do
[checkout builder](https://github.com/workoutagencia29-web/abaproducts), reaproveitando o
mesmo design system (tema navy/azul `#2F6BFF`, fonte Inter, cards arredondados, dark/light).

É um **frontend de alta fidelidade** com dados **simulados** (mock determinístico) — pronto
para plugar em um backend real depois.

## Stack

- **Vite 5** + **React 18** + **TypeScript** (strict)
- **Tailwind CSS 3** com tokens semânticos via CSS variables (`src/index.css`)
- **react-router-dom 7** (rotas + gate de login)
- **recharts** (gráficos) · **lucide-react** (ícones) · **react-day-picker** (filtro de período)

## Rodando

```bash
npm install
npm run dev      # http://localhost:5174
npm run build    # tsc --noEmit && vite build  ->  dist/
npm run preview
```

**Login (demo):** qualquer e-mail e senha entram no painel — sugestão `admin@nummo.com`.

## Estrutura

```
src/
  main.tsx                 # providers: Theme, Auth, Toast + Router
  App.tsx                  # rotas + RequireAuth (gate de login)
  index.css                # tokens de tema (light/dark) + estilos base
  context/                 # ThemeContext, AuthContext (mock)
  lib/                     # utils (formatação R$/%/datas), date, rng (mulberry32)
  data/                    # dados mock por domínio (shared, transações, sellers, financeiro…)
  components/
    ui/                    # design system: Button, Input, DataTable, Drawer, Modal,
                           #   KpiCard, StatusBadge, Tabs, Toast, DateRangeFilter… (barrel em index.ts)
    charts/Charts.tsx      # AreaTrend, LineTrend, BarsChart, DonutChart, Sparkline (recharts temados)
    layout/                # Sidebar, Topbar, Layout
  pages/                   # uma pasta por área do menu (ver abaixo)
```

## Módulos / telas

| Área | Telas |
|---|---|
| **Visão Geral** | Dashboard (TPV, aprovação, chargeback, funil, top sellers, alertas) |
| **Transações** | Pagamentos (filtros, ocultar/mascarar dados, drawer completo, editar status, Cripto) · MED & Chargebacks · Reembolsos |
| **Sellers** | Lista · KYC & Aprovação · Detalhe do seller (12 abas: Métricas, Transações, MEDs, Reserva, KYC/Cerberus, Taxas por método, Configurações, Gestão de Saldo, Co-Produção, Subcontas, Adquirentes, Lucro por adquirente; + Acessar Conta / WhatsApp) |
| **Financeiro** | Visão da plataforma · Saques · Antecipações · Reservas |
| **Relatórios** | Consolidação (DRE / P&L do gateway) · Conciliação por adquirente |
| **Risco** | Antifraude · Blocklist |
| **Gateway** | Taxas & Planos · Adquirentes & Roteamento · Métodos · Webhooks & API |
| **Clientes** | Compradores finais |
| **Marketplace** | Produtos dos sellers (auditoria/moderação em grid de cards) |
| **Administração** | Administradores · Permissões · Logs & Auditoria |
| **Plataforma** | Atualizações (changelog) |
| **Conta** | Configurações · Login |

## Design system (resumo)

- Cores **somente** via tokens semânticos: `background`, `card`, `card-muted`, `border`,
  `foreground`, `muted`, `faint`, `primary`, `success`, `warning`, `danger`, `info`.
- Componha telas com `PageHeader` + uma `div.space-y-6`; cards via `SectionCard`;
  listagens via `DataTable`; detalhes via `Drawer`/`Modal`; feedback via `useToast()`.
- Dados mock determinísticos (`mulberry32`/`hashStr`) — render estável entre reloads,
  sem `Math.random`.

## Próximos passos (backend)

Trocar os módulos em `src/data/*` por uma camada de serviço (`fetch`/React Query) apontando
para a API do gateway: transações, sellers/KYC, saques, antecipações, MED, taxas,
roteamento de adquirentes, webhooks. Ver o handoff técnico do `abaproducts` para o contrato.
