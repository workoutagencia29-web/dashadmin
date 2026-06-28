import { useMemo, useState } from 'react'
import { Plus, Trash2, ShieldBan, Fingerprint, CreditCard, Globe } from 'lucide-react'
import {
  PageHeader,
  KpiCard,
  SectionCard,
  SearchInput,
  MultiSelect,
  Select,
  Toolbar,
  DataTable,
  Badge,
  IconButton,
  Field,
  Input,
  Button,
  Modal,
  type Column,
  type BadgeTone,
} from '../../components/ui'
import {
  blocklist,
  BLOCKLIST_TYPES,
  type BlocklistEntry,
  type BlocklistType,
} from '../../data/riscoData'
import { formatNumber } from '../../lib/utils'
import { formatDateTime } from '../../lib/date'
import { useToast } from '../../components/ui/Toast'

const TYPE_TONE: Record<BlocklistType, BadgeTone> = {
  CPF: 'info',
  CNPJ: 'info',
  'E-mail': 'violet',
  'Cartão (BIN)': 'warning',
  IP: 'neutral',
  Telefone: 'success',
}

export default function Blocklist() {
  const { toast } = useToast()
  const [entries, setEntries] = useState<BlocklistEntry[]>(blocklist)
  const [query, setQuery] = useState('')
  const [types, setTypes] = useState<string[]>([])
  const [modalOpen, setModalOpen] = useState(false)

  // Form state
  const [formType, setFormType] = useState<BlocklistType>('CPF')
  const [formValue, setFormValue] = useState('')
  const [formReason, setFormReason] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return entries.filter((e) => {
      if (q && !`${e.valor} ${e.motivo} ${e.addedBy}`.toLowerCase().includes(q)) return false
      if (types.length && !types.includes(e.tipo)) return false
      return true
    })
  }, [entries, query, types])

  function resetForm() {
    setFormType('CPF')
    setFormValue('')
    setFormReason('')
  }

  function handleAdd() {
    if (!formValue.trim() || !formReason.trim()) {
      toast('Preencha valor e motivo', 'error')
      return
    }
    const entry: BlocklistEntry = {
      id: `bl_${Date.now().toString(36)}`,
      tipo: formType,
      valor: formValue.trim(),
      motivo: formReason.trim(),
      addedBy: 'Pedro Costa',
      date: new Date(),
    }
    setEntries((prev) => [entry, ...prev])
    setModalOpen(false)
    resetForm()
    toast('Entrada adicionada à blocklist', 'success')
  }

  function handleRemove(entry: BlocklistEntry) {
    setEntries((prev) => prev.filter((e) => e.id !== entry.id))
    toast(`Entrada ${entry.valor} removida`, 'info')
  }

  const cpfCnpj = entries.filter((e) => e.tipo === 'CPF' || e.tipo === 'CNPJ').length
  const cards = entries.filter((e) => e.tipo === 'Cartão (BIN)').length
  const network = entries.filter((e) => e.tipo === 'IP' || e.tipo === 'Telefone').length

  const columns: Column<BlocklistEntry>[] = [
    {
      header: 'Tipo',
      cell: (e) => <Badge tone={TYPE_TONE[e.tipo]}>{e.tipo}</Badge>,
      nowrap: true,
    },
    {
      header: 'Valor',
      cell: (e) => <span className="font-medium text-foreground">{e.valor}</span>,
      nowrap: true,
    },
    { header: 'Motivo', cell: (e) => <span className="text-foreground">{e.motivo}</span> },
    { header: 'Adicionado por', cell: (e) => <span className="text-muted">{e.addedBy}</span>, nowrap: true },
    {
      header: 'Data',
      cell: (e) => <span className="text-muted">{formatDateTime(e.date)}</span>,
      nowrap: true,
    },
    {
      header: '',
      align: 'right',
      cell: (e) => (
        <IconButton
          label="Remover"
          onClick={() => handleRemove(e)}
          className="hover:bg-danger/10 hover:text-danger"
        >
          <Trash2 className="h-4 w-4" />
        </IconButton>
      ),
      nowrap: true,
    },
  ]

  return (
    <>
      <PageHeader
        title="Blocklist"
        subtitle="Documentos, cartões e identificadores bloqueados na plataforma"
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" /> Adicionar à blocklist
          </Button>
        }
      />

      <div className="space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Total de entradas" value={formatNumber(entries.length)} icon={ShieldBan} />
          <KpiCard label="CPF / CNPJ" value={formatNumber(cpfCnpj)} icon={Fingerprint} />
          <KpiCard label="Cartões (BIN)" value={formatNumber(cards)} icon={CreditCard} />
          <KpiCard label="IP / Telefone" value={formatNumber(network)} icon={Globe} />
        </div>

        {/* Lista */}
        <SectionCard title="Entradas bloqueadas" description="Bloqueios aplicados em toda a base">
          <Toolbar
            left={
              <>
                <SearchInput value={query} onChange={setQuery} placeholder="Valor, motivo, responsável…" />
                <MultiSelect
                  label="Tipo"
                  options={[...BLOCKLIST_TYPES]}
                  selected={types}
                  onChange={setTypes}
                />
              </>
            }
            right={<span className="text-sm text-muted">{filtered.length} resultados</span>}
          />

          <div className="mt-5">
            <DataTable
              columns={columns}
              rows={filtered}
              keyField={(e) => e.id}
              pageSize={10}
              minWidth={840}
              emptyLabel="Nenhuma entrada na blocklist para os filtros."
              emptyIcon={<ShieldBan className="h-8 w-8" />}
            />
          </div>
        </SectionCard>
      </div>

      {/* Modal de adicionar */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Adicionar à blocklist"
        description="O identificador será bloqueado em novas transações imediatamente."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleAdd}>
              <Plus className="h-4 w-4" /> Confirmar bloqueio
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Tipo de identificador">
            <Select value={formType} onChange={(e) => setFormType(e.target.value as BlocklistType)}>
              {BLOCKLIST_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Valor" hint="Ex.: CPF, e-mail, BIN do cartão, IP ou telefone.">
            <Input
              value={formValue}
              onChange={(e) => setFormValue(e.target.value)}
              placeholder="Identificador a bloquear"
            />
          </Field>

          <Field label="Motivo">
            <Input
              value={formReason}
              onChange={(e) => setFormReason(e.target.value)}
              placeholder="Ex.: Fraude confirmada"
            />
          </Field>
        </div>
      </Modal>
    </>
  )
}
