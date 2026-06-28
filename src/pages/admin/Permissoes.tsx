import { ShieldCheck, Pencil, Users } from 'lucide-react'
import {
  PageHeader,
  SectionCard,
  Card,
  DataTable,
  Badge,
  Button,
  type Column,
  type BadgeTone,
} from '../../components/ui'
import { useToast } from '../../components/ui/Toast'
import {
  roles,
  modules,
  permissionMatrix,
  ADMIN_ROLES,
  type PermissionLevel,
  type AdminRole,
} from '../../data/adminData'
import { formatNumber } from '../../lib/utils'

const LEVEL_TONE: Record<PermissionLevel, BadgeTone> = {
  Total: 'success',
  Editar: 'info',
  Ver: 'neutral',
  Nenhum: 'neutral',
}

interface ModuleRow {
  module: string
}

export default function Permissoes() {
  const { toast } = useToast()

  const moduleRows: ModuleRow[] = modules.map((module) => ({ module }))

  const columns: Column<ModuleRow>[] = [
    {
      header: 'Módulo',
      cell: (r) => <span className="font-medium text-foreground">{r.module}</span>,
      nowrap: true,
    },
    ...ADMIN_ROLES.map(
      (role: AdminRole): Column<ModuleRow> => ({
        header: role,
        align: 'center',
        nowrap: true,
        cell: (r) => {
          const level = permissionMatrix[role][r.module]
          if (level === 'Nenhum') {
            return <span className="text-xs font-medium text-faint">Nenhum</span>
          }
          return <Badge tone={LEVEL_TONE[level]}>{level}</Badge>
        },
      }),
    ),
  ]

  return (
    <>
      <PageHeader
        title="Permissões"
        subtitle="Papéis de acesso e matriz de permissões por módulo"
        actions={
          <Button variant="outline" onClick={() => toast('Edição de permissões — em breve', 'info')}>
            <Pencil className="h-4 w-4" /> Editar permissões
          </Button>
        }
      />

      <div className="space-y-6">
        <SectionCard title="Papéis" description="Conjuntos de permissões atribuíveis aos administradores">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {roles.map((role) => (
              <Card key={role.id} className="flex flex-col gap-3 bg-card-muted/30 p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                  <Badge tone="neutral">
                    <Users className="h-3 w-3" />
                    {formatNumber(role.membros)} {role.membros === 1 ? 'membro' : 'membros'}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-base font-bold text-foreground">{role.nome}</h4>
                  <p className="mt-1 text-sm text-muted">{role.descricao}</p>
                </div>
              </Card>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Matriz de permissões"
          description="Nível de acesso de cada papel por módulo da plataforma"
        >
          <DataTable
            columns={columns}
            rows={moduleRows}
            keyField={(r) => r.module}
            minWidth={820}
            emptyLabel="Nenhum módulo configurado."
          />
          <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <Badge tone="success">Total</Badge> acesso completo
            </span>
            <span className="flex items-center gap-1.5">
              <Badge tone="info">Editar</Badge> ver e modificar
            </span>
            <span className="flex items-center gap-1.5">
              <Badge tone="neutral">Ver</Badge> somente leitura
            </span>
            <span className="flex items-center gap-1.5">
              <span className="font-medium text-faint">Nenhum</span> sem acesso
            </span>
          </div>
        </SectionCard>
      </div>
    </>
  )
}
