import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronDown, ChevronsLeft, Settings, Sun, Moon } from 'lucide-react'
import { navItems, type NavItem } from '../../data/nav'
import { cn } from '../../lib/utils'
import { useTheme } from '../../context/ThemeContext'
import { Logo } from './Logo'

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
}

export function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }: SidebarProps) {
  const { theme, setTheme } = useTheme()
  const { pathname } = useLocation()
  const matchPath = (p: string) =>
    p === '/' ? pathname === '/' : pathname === p || pathname.startsWith(p + '/')

  const activeGroup = navItems.find((i) => i.children?.some((c) => matchPath(c.path)))?.label ?? null
  const [expanded, setExpanded] = useState<string | null>(activeGroup)

  useEffect(() => {
    if (activeGroup) setExpanded(activeGroup)
  }, [activeGroup])

  function renderItem(item: NavItem) {
    const Icon = item.icon
    const hasChildren = !!item.children?.length
    const isOpen = expanded === item.label
    const directActive = !!item.path && matchPath(item.path)
    const groupActive = item.children?.some((c) => matchPath(c.path)) ?? false

    if (item.disabled) {
      return (
        <div
          key={item.label}
          title={collapsed ? `${item.label} · ${item.badge}` : undefined}
          className={cn(
            'flex w-full cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-faint',
            collapsed && 'justify-center px-0',
          )}
        >
          <Icon className="h-5 w-5 shrink-0" strokeWidth={2} />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span className="rounded-md bg-card-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-faint">
                  {item.badge}
                </span>
              )}
            </>
          )}
        </div>
      )
    }

    if (item.path) {
      return (
        <Link
          key={item.label}
          to={item.path}
          onClick={onCloseMobile}
          title={collapsed ? item.label : undefined}
          className={cn(
            'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
            collapsed && 'justify-center px-0',
            directActive
              ? 'bg-primary text-primary-foreground shadow-glow'
              : 'text-muted hover:bg-card-muted hover:text-foreground',
          )}
        >
          <Icon className="h-5 w-5 shrink-0" strokeWidth={2} />
          {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
        </Link>
      )
    }

    return (
      <div key={item.label}>
        <button
          onClick={() => {
            if (collapsed) {
              onToggleCollapse()
              setExpanded(item.label)
            } else {
              setExpanded(isOpen ? null : item.label)
            }
          }}
          title={collapsed ? item.label : undefined}
          className={cn(
            'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
            collapsed && 'justify-center px-0',
            groupActive ? 'text-foreground' : 'text-muted hover:bg-card-muted hover:text-foreground',
          )}
        >
          <Icon className="h-5 w-5 shrink-0" strokeWidth={2} />
          {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
          {!collapsed && hasChildren && (
            <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
          )}
        </button>

        {!collapsed && hasChildren && (
          <div
            className={cn(
              'grid transition-all duration-300 ease-in-out',
              isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
            )}
          >
            <div className="overflow-hidden">
              <div className="ml-[26px] mt-1 space-y-0.5 border-l border-border pl-3">
                {(() => {
                  // só o item mais específico (caminho mais longo que casa) fica ativo —
                  // evita o item-índice do grupo (ex.: /transacoes) acender junto da sub-rota
                  const best =
                    item
                      .children!.filter((c) => pathname === c.path || pathname.startsWith(c.path + '/'))
                      .sort((a, b) => b.path.length - a.path.length)[0]?.path ?? null
                  return item.children!.map((child) => {
                    const childActive = child.path === best
                    return (
                      <Link
                        key={child.path}
                        to={child.path}
                        onClick={onCloseMobile}
                        className={cn(
                          'block w-full rounded-lg px-3 py-1.5 text-left text-[13px] transition-colors',
                          childActive
                            ? 'bg-primary/10 font-medium text-primary'
                            : 'text-muted hover:bg-card-muted hover:text-foreground',
                        )}
                      >
                        {child.label}
                      </Link>
                    )
                  })
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-border bg-sidebar transition-[width,transform] duration-300 ease-in-out lg:static lg:translate-x-0',
          collapsed ? 'w-[84px]' : 'w-[264px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Brand */}
        <div className={cn('flex h-[76px] items-center gap-2.5 px-5', collapsed && 'justify-center px-0')}>
          {collapsed ? (
            <Logo variant="mark" className="h-7 w-auto text-foreground" />
          ) : (
            <>
              <Logo className="h-[22px] w-auto shrink-0 text-foreground" />
              <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                Admin
              </span>
              <button
                onClick={onToggleCollapse}
                className="ml-auto hidden rounded-lg p-1.5 text-muted transition-colors hover:bg-card-muted hover:text-foreground lg:block"
                aria-label="Recolher menu"
              >
                <ChevronsLeft className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {collapsed && (
          <button
            onClick={onToggleCollapse}
            className="mx-auto mb-2 hidden rounded-lg p-1.5 text-muted transition-colors hover:bg-card-muted hover:text-foreground lg:block"
            aria-label="Expandir menu"
          >
            <ChevronsLeft className="h-5 w-5 rotate-180" />
          </button>
        )}

        {/* Nav */}
        <nav className="scrollbar-thin flex-1 space-y-1 overflow-y-auto overscroll-none px-3 py-2">
          {navItems.map(renderItem)}
        </nav>

        {/* Footer */}
        <div className="space-y-1 border-t border-border px-3 py-3">
          <Link
            to="/configuracoes"
            onClick={onCloseMobile}
            title={collapsed ? 'Configurações' : undefined}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              collapsed && 'justify-center px-0',
              pathname === '/configuracoes'
                ? 'bg-primary text-primary-foreground shadow-glow'
                : 'text-muted hover:bg-card-muted hover:text-foreground',
            )}
          >
            <Settings className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="flex-1 text-left">Configurações</span>}
          </Link>

          <ThemeToggle collapsed={collapsed} theme={theme} onSet={setTheme} />
        </div>
      </aside>
    </>
  )
}

function ThemeToggle({
  collapsed,
  theme,
  onSet,
}: {
  collapsed: boolean
  theme: 'light' | 'dark'
  onSet: (t: 'light' | 'dark') => void
}) {
  if (collapsed) {
    return (
      <button
        onClick={() => onSet(theme === 'dark' ? 'light' : 'dark')}
        className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-card-muted text-foreground transition-colors hover:bg-input"
        aria-label="Alternar tema"
      >
        {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
      </button>
    )
  }

  return (
    <div className="mt-1 flex items-center gap-1 rounded-xl bg-card-muted p-1">
      <button
        onClick={() => onSet('light')}
        className={cn(
          'flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors',
          theme === 'light' ? 'bg-card text-foreground shadow-sm' : 'text-muted hover:text-foreground',
        )}
      >
        <Sun className="h-4 w-4" />
        Claro
      </button>
      <button
        onClick={() => onSet('dark')}
        className={cn(
          'flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors',
          theme === 'dark'
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted hover:text-foreground',
        )}
      >
        <Moon className="h-4 w-4" />
        Escuro
      </button>
    </div>
  )
}
