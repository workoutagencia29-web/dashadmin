import { useMemo, useState } from 'react'
import { UserPlus, Users, ShieldCheck, UserCheck, MoreVertical, Pencil, UserX } from 'lucide-react'
import {
  PageHeader,
  KpiCard,
  SectionCard,
  DataTable,
  Badge,
  StatusBadge,
  Avatar,
  Dropdown,
  Button,
  Field,
  Input,
  Select,
  Modal,
  type Column,
  type BadgeTone,
} from '../../components/ui'
import { useToast } from '../../components/ui/Toast'
import { adminUsers, ADMIN_ROLES, type AdminUser, type AdminRole } from '../../data/adminData'
import { formatNumber } from '../../lib/utils'
import { timeAgo, formatShort } from '../../lib/date'

const ROLE_TONE: Record<AdminRole, BadgeTone> = {
  'Super Admin': 'violet',
  Financeiro: 'info',
  Suporte: 'success',
  Risco: 'warning',
  'Somente leitura': 'neutral',
}

export default function Administradores() {
  const { toast } = useToast()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<AdminRole>('Suporte')

  const totalAtivos = useMemo(() => adminUsers.filter((u) => u.status === 'Ativo').length, [])
  const totalSuperAdmins = useMemo(() => adminUsers.filter((u) => u.role === 'Super Admin').length, [])

  function handleInvite() {
    if (!inviteName.trim() || !inviteEmail.trim()) {
      toast('Preencha nome e e-mail', 'error')
      return
    }
    toast(`Convite enviado para ${inviteEmail}`)
    setInviteOpen(false)
    setInviteName('')
    setInviteEmail('')
    setInviteRole('Suporte')
  }

  const columns: Column<AdminUser>[] = [
    {
      header: 'Usuário',
      cell: (u) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={u.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{u.name}</p>
            <p className="truncate text-xs text-muted">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Papel',
      cell: (u) => <Badge tone={ROLE_TONE[u.role]}>{u.role}</Badge>,
      nowrap: true,
    },
    {
      header: 'Último acesso',
      cell: (u) => <span className="text-muted">{timeAgo(u.ultimoAcesso)}</span>,
      nowrap: true,
    },
    {
      header: 'Criado em',
      cell: (u) => <span className="text-muted">{formatShort(u.criadoEm)}</span>,
      nowrap: true,
    },
    { header: 'Status', cell: (u) => <StatusBadge status={u.status} />, nowrap: true },
    {
      header: '',
      align: 'right',
      nowrap: true,
      cell: (u) => (
        <Dropdown
          trigger={
            <button
              className="rounded-lg p-1.5 text-muted transition-colors hover:bg-card-muted hover:text-foreground"
              aria-label="Ações"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          }
          items={[
            {
              label: 'Editar',
              icon: <Pencil className="h-4 w-4" />,
              onClick: () => toast(`Editando ${u.name}`, 'info'),
            },
            {
              label: u.status === 'Ativo' ? 'Desativar' : 'Reativar',
              icon: <UserX className="h-4 w-4" />,
              tone: u.status === 'Ativo' ? 'danger' : 'default',
              onClick: () =>
                toast(
                  u.status === 'Ativo' ? `${u.name} desativado` : `${u.name} reativado`,
                  u.status === 'Ativo' ? 'error' : 'success',
                ),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Administradores"
        subtitle="Usuários internos com acesso ao painel Nummo"
        actions={
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4" /> Convidar admin
          </Button>
        }
      />

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Administradores" value={formatNumber(adminUsers.length)} icon={Users} />
          <KpiCard label="Ativos" value={formatNumber(totalAtivos)} icon={UserCheck} />
          <KpiCard
            label="Inativos"
            value={formatNumber(adminUsers.length - totalAtivos)}
            icon={UserX}
          />
          <KpiCard label="Super Admins" value={formatNumber(totalSuperAdmins)} icon={ShieldCheck} />
        </div>

        <SectionCard title="Equipe interna" description="Contas com permissão de acesso ao admin">
          <DataTable
            columns={columns}
            rows={adminUsers}
            keyField={(u) => u.id}
            minWidth={780}
            emptyLabel="Nenhum administrador cadastrado."
          />
        </SectionCard>
      </div>

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Convidar administrador"
        description="O convite será enviado por e-mail com instruções de acesso."
        footer={
          <>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleInvite}>
              <UserPlus className="h-4 w-4" /> Enviar convite
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Nome completo">
            <Input
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="Ex.: Ana Ribeiro"
            />
          </Field>
          <Field label="E-mail corporativo">
            <Input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="nome@nummo.com.br"
            />
          </Field>
          <Field label="Papel" hint="Define os módulos que o usuário poderá acessar.">
            <Select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as AdminRole)}>
              {ADMIN_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Modal>
    </>
  )
}
