import { useState } from 'react'
import { Plus, KeyRound, Copy, Webhook } from 'lucide-react'
import {
  PageHeader,
  SectionCard,
  Field,
  Input,
  Button,
  Switch,
  Badge,
  IconButton,
  Modal,
  MultiSelect,
  DataTable,
  type Column,
} from '../../components/ui'
import { useToast } from '../../components/ui/Toast'
import {
  webhookEndpoints,
  webhookEvents,
  apiKeys,
  type WebhookEndpoint,
  type WebhookEvent,
  type ApiKey,
} from '../../data/gatewayData'
import { formatDateTime, formatShort, timeAgo } from '../../lib/date'

const EVENT_OPTIONS = [
  'payment.approved',
  'payment.refused',
  'payment.refunded',
  'payout.completed',
  'chargeback.opened',
  'subscription.canceled',
]

function statusBadge(status: number) {
  const ok = status >= 200 && status < 300
  return <Badge tone={ok ? 'success' : 'danger'}>{status}</Badge>
}

export default function Webhooks() {
  const { toast } = useToast()
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>(webhookEndpoints)
  const [openNew, setOpenNew] = useState(false)
  const [newUrl, setNewUrl] = useState('')
  const [newEventos, setNewEventos] = useState<string[]>(['payment.approved'])

  function toggleEndpoint(id: string) {
    setEndpoints((prev) => prev.map((e) => (e.id === id ? { ...e, ativo: !e.ativo } : e)))
  }

  function createEndpoint() {
    if (!newUrl.trim()) {
      toast('Informe a URL do endpoint', 'error')
      return
    }
    const novo: WebhookEndpoint = {
      id: `wh_${Date.now().toString(36)}`,
      url: newUrl.trim(),
      eventos: newEventos.length ? newEventos : ['payment.approved'],
      ativo: true,
      ultimoStatus: 200,
      ultimoEnvio: new Date(),
    }
    setEndpoints((prev) => [novo, ...prev])
    setOpenNew(false)
    setNewUrl('')
    setNewEventos(['payment.approved'])
    toast('Endpoint criado')
  }

  function copyKey(prefixo: string) {
    navigator.clipboard?.writeText(`${prefixo}_${'x'.repeat(24)}`)
    toast('Chave copiada')
  }

  const endpointColumns: Column<WebhookEndpoint>[] = [
    {
      header: 'URL',
      cell: (e) => (
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-card-muted text-muted">
            <Webhook className="h-4 w-4" />
          </span>
          <span className="font-medium text-foreground">{e.url}</span>
        </div>
      ),
    },
    {
      header: 'Eventos',
      cell: (e) => <Badge tone="info">{e.eventos.length} eventos</Badge>,
      nowrap: true,
    },
    { header: 'Último status', cell: (e) => statusBadge(e.ultimoStatus), nowrap: true },
    {
      header: 'Último envio',
      cell: (e) => <span className="text-muted">{timeAgo(e.ultimoEnvio)}</span>,
      nowrap: true,
    },
    {
      header: 'Ativo',
      align: 'right',
      cell: (e) => <Switch checked={e.ativo} onChange={() => toggleEndpoint(e.id)} />,
      nowrap: true,
    },
  ]

  const keyColumns: Column<ApiKey>[] = [
    {
      header: 'Nome',
      cell: (k) => (
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-card-muted text-muted">
            <KeyRound className="h-4 w-4" />
          </span>
          <span className="font-medium text-foreground">{k.nome}</span>
        </div>
      ),
    },
    {
      header: 'Chave',
      cell: (k) => <span className="font-mono text-sm text-muted">{k.prefixo}_••••••••</span>,
      nowrap: true,
    },
    {
      header: 'Ambiente',
      cell: (k) => <Badge tone={k.ambiente === 'Produção' ? 'success' : 'warning'}>{k.ambiente}</Badge>,
      nowrap: true,
    },
    {
      header: 'Criada em',
      cell: (k) => <span className="text-muted">{formatShort(k.criadaEm)}</span>,
      nowrap: true,
    },
    {
      header: 'Último uso',
      cell: (k) => <span className="text-muted">{timeAgo(k.ultimoUso)}</span>,
      nowrap: true,
    },
    {
      header: '',
      align: 'right',
      cell: (k) => (
        <IconButton label="Copiar chave" onClick={() => copyKey(k.prefixo)}>
          <Copy className="h-4 w-4" />
        </IconButton>
      ),
      nowrap: true,
    },
  ]

  const eventColumns: Column<WebhookEvent>[] = [
    {
      header: 'Evento',
      cell: (e) => <span className="font-mono text-sm font-medium text-foreground">{e.evento}</span>,
      nowrap: true,
    },
    { header: 'Status', cell: (e) => statusBadge(e.status), nowrap: true },
    {
      header: 'Tentativas',
      align: 'center',
      cell: (e) => (
        <span className={e.tentativas > 1 ? 'font-semibold text-warning' : 'text-muted'}>{e.tentativas}</span>
      ),
      nowrap: true,
    },
    {
      header: 'Data',
      align: 'right',
      cell: (e) => <span className="text-muted">{formatDateTime(e.date)}</span>,
      nowrap: true,
    },
  ]

  return (
    <>
      <PageHeader
        title="Webhooks & API"
        subtitle="Endpoints de notificação, chaves de acesso e log de entregas"
        actions={
          <Button onClick={() => setOpenNew(true)}>
            <Plus className="h-4 w-4" /> Novo endpoint
          </Button>
        }
      />

      <div className="space-y-6">
        <SectionCard title="Endpoints" description="URLs que recebem as notificações de eventos do gateway">
          <DataTable
            columns={endpointColumns}
            rows={endpoints}
            keyField={(e) => e.id}
            minWidth={760}
            emptyLabel="Nenhum endpoint configurado."
          />
        </SectionCard>

        <SectionCard
          title="Chaves de API"
          description="Credenciais de integração — nunca exponha chaves de produção"
          action={
            <Button size="sm" onClick={() => toast('Nova chave gerada')}>
              <KeyRound className="h-4 w-4" /> Gerar chave
            </Button>
          }
        >
          <DataTable
            columns={keyColumns}
            rows={apiKeys}
            keyField={(k) => k.id}
            minWidth={760}
            emptyLabel="Nenhuma chave gerada."
          />
        </SectionCard>

        <SectionCard title="Entregas recentes" description="Últimas tentativas de entrega dos webhooks">
          <DataTable
            columns={eventColumns}
            rows={webhookEvents}
            keyField={(e) => e.id}
            pageSize={10}
            minWidth={620}
            emptyLabel="Nenhuma entrega registrada."
          />
        </SectionCard>
      </div>

      {/* Modal novo endpoint */}
      <Modal
        open={openNew}
        onClose={() => setOpenNew(false)}
        title="Novo endpoint de webhook"
        description="Informe a URL HTTPS e selecione os eventos a notificar"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setOpenNew(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={createEndpoint}>
              Criar endpoint
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="URL do endpoint" hint="Use HTTPS. Enviaremos um POST com o payload do evento.">
            <Input
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://api.suaempresa.com/webhooks/nummo"
            />
          </Field>
          <Field label="Eventos" hint="Selecione quais eventos disparam este endpoint.">
            <MultiSelect
              label="Selecione os eventos"
              options={EVENT_OPTIONS}
              selected={newEventos}
              onChange={setNewEventos}
            />
          </Field>
        </div>
      </Modal>
    </>
  )
}
