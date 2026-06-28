import { useNavigate } from 'react-router-dom'
import { Menu, Bell, Settings as SettingsIcon, ChevronDown } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Avatar } from '../ui/Avatar'
import { Dropdown } from '../ui/Dropdown'

export function Topbar({ onOpenMobile }: { onOpenMobile: () => void }) {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="sticky top-0 z-30 flex h-[64px] items-center justify-between gap-3 border-b border-border bg-background/80 px-5 backdrop-blur-md sm:px-8">
      <button
        onClick={onOpenMobile}
        className="rounded-lg border border-border bg-card p-2 text-foreground lg:hidden"
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* status do gateway */}
      <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 lg:flex">
        <span className="h-1.5 w-1.5 rounded-full bg-success" />
        <span className="text-xs font-medium text-muted">Operacional</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          className="relative rounded-xl border border-border bg-card p-2.5 text-muted transition-colors hover:text-foreground"
          aria-label="Notificações"
        >
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-danger" />
        </button>

        <Dropdown
          align="right"
          trigger={
            <button className="flex items-center gap-2.5 rounded-xl border border-border bg-card py-1.5 pl-1.5 pr-3 transition-colors hover:bg-card-muted">
              <Avatar name={user.name} size="sm" />
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-semibold leading-tight text-foreground">{user.name}</span>
                <span className="block text-[11px] leading-tight text-muted">{user.role}</span>
              </span>
              <ChevronDown className="h-4 w-4 text-muted" />
            </button>
          }
          items={[
            {
              label: 'Configurações',
              icon: <SettingsIcon className="h-4 w-4" />,
              onClick: () => navigate('/configuracoes'),
            },
          ]}
        />
      </div>
    </div>
  )
}
