import { useMemo, useState } from 'react'
import {
  PageHeader,
  SectionCard,
  DataTable,
  Avatar,
  SearchInput,
  Select,
  Toolbar,
  ExportButtons,
  downloadCsv,
  type Column,
} from '../../components/ui'
import { auditLogs, auditActions, adminUsers, type AuditLog, type LogTone } from '../../data/adminData'
import { formatDateTime } from '../../lib/date'

const TONE_DOT: Record<LogTone, string> = {
  info: 'bg-info',
  warning: 'bg-warning',
  danger: 'bg-danger',
}

const TONE_LABEL: Record<LogTone, string> = {
  info: 'Informativo',
  warning: 'Atenção',
  danger: 'Crítico',
}

export default function Logs() {
  const [query, setQuery] = useState('')
  const [actor, setActor] = useState('Todos')
  const [action, setAction] = useState('Todas')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return auditLogs.filter((l) => {
      if (q && !`${l.actor} ${l.action} ${l.target} ${l.ip}`.toLowerCase().includes(q)) return false
      if (actor !== 'Todos' && l.actor !== actor) return false
      if (action !== 'Todas' && l.action !== action) return false
      return true
    })
  }, [query, actor, action])

  const columns: Column<AuditLog>[] = [
    {
      header: 'Ator',
      cell: (l) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={l.actor} size="sm" />
          <span className="font-medium text-foreground">{l.actor}</span>
        </div>
      ),
      nowrap: true,
    },
    {
      header: 'Ação',
      cell: (l) => (
        <div className="flex items-center gap-2.5">
          <span
            className={`h-2 w-2 shrink-0 rounded-full ${TONE_DOT[l.tone]}`}
            title={TONE_LABEL[l.tone]}
            aria-label={TONE_LABEL[l.tone]}
          />
          <span className="font-medium text-foreground">{l.action}</span>
        </div>
      ),
    },
    { header: 'Alvo', cell: (l) => <span className="text-muted">{l.target}</span> },
    {
      header: 'IP',
      cell: (l) => <span className="font-mono text-xs text-muted">{l.ip}</span>,
      nowrap: true,
    },
    {
      header: 'Data/hora',
      align: 'right',
      cell: (l) => <span className="text-muted">{formatDateTime(l.date)}</span>,
      nowrap: true,
    },
  ]

  function exportCsv() {
    downloadCsv(
      'auditoria.csv',
      ['ID', 'Ator', 'Ação', 'Alvo', 'IP', 'Data/hora', 'Severidade'],
      filtered.map((l) => [
        l.id,
        l.actor,
        l.action,
        l.target,
        l.ip,
        formatDateTime(l.date),
        TONE_LABEL[l.tone],
      ]),
    )
  }

  return (
    <>
      <PageHeader
        title="Logs & Auditoria"
        subtitle="Trilha de eventos sensíveis executados no painel"
        actions={<ExportButtons formats={['CSV']} onCsv={exportCsv} />}
      />

      <div className="space-y-6">
        <SectionCard>
          <Toolbar
            left={
              <>
                <SearchInput value={query} onChange={setQuery} placeholder="Ator, ação, alvo, IP…" />
                <Select value={actor} onChange={(e) => setActor(e.target.value)} className="w-auto">
                  <option value="Todos">Todos os atores</option>
                  {adminUsers.map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.name}
                    </option>
                  ))}
                </Select>
                <Select value={action} onChange={(e) => setAction(e.target.value)} className="w-auto">
                  <option value="Todas">Todas as ações</option>
                  {auditActions.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </Select>
              </>
            }
            right={<span className="text-sm text-muted">{filtered.length} eventos</span>}
          />

          <div className="mt-5">
            <DataTable
              columns={columns}
              rows={filtered}
              keyField={(l) => l.id}
              pageSize={14}
              minWidth={860}
              emptyLabel="Nenhum evento para os filtros."
            />
          </div>
        </SectionCard>
      </div>
    </>
  )
}
