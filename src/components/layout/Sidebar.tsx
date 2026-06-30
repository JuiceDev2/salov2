'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import { useRouter } from 'next/navigation'
import type { Perfil } from '@/types'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  icon: string
}

const NAV_PROPIETARIA: NavItem[] = [
  { label: 'Resumen global',  href: '/propietaria',          icon: '◈' },
  { label: 'Salones',         href: '/propietaria/salones',   icon: '🏪' },
  { label: 'Administradores', href: '/propietaria/admins',    icon: '👤' },
  { label: 'Reportes',        href: '/propietaria/reportes',  icon: '📊' },
]

const NAV_ADMIN: NavItem[] = [
  { label: 'Dashboard',    href: '/admin',             icon: '◈' },
  { label: 'Citas',        href: '/admin/citas',        icon: '📅' },
  { label: 'Clientes',     href: '/admin/clientes',     icon: '👥' },
  { label: 'Servicios',    href: '/admin/servicios',    icon: '✂' },
  { label: 'Estilistas',   href: '/admin/estilistas',   icon: '💄' },
  { label: 'Actividad',    href: '/admin/actividad',    icon: '📋' },
]

const NAV_ESTILISTA: NavItem[] = [
  { label: 'Mis citas',    href: '/estilista',         icon: '📅' },
  { label: 'Cobrar',       href: '/estilista/caja',    icon: '💵' },
]

function getNav(rol: string): NavItem[] {
  if (rol === 'propietaria') return NAV_PROPIETARIA
  if (rol === 'admin')       return NAV_ADMIN
  return NAV_ESTILISTA
}

function getRolLabel(rol: string): string {
  if (rol === 'propietaria') return 'Propietaria'
  if (rol === 'admin')       return 'Administrador'
  return 'Estilista'
}

export default function Sidebar({ perfil }: { perfil: Perfil }) {
  const pathname = usePathname()
  const router = useRouter()
  const nav = getNav(perfil.rol)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-56 flex flex-col shrink-0 border-r"
           style={{ background: 'var(--color-salon-900)', borderColor: 'var(--color-salon-800)' }}>

      {/* Logo */}
      <div className="px-5 py-5 border-b" style={{ borderColor: 'var(--color-salon-800)' }}>
        <p className="text-xs font-medium tracking-widest uppercase mb-1"
           style={{ color: 'var(--color-salon-400)' }}>
          {getRolLabel(perfil.rol)}
        </p>
        <p className="font-semibold text-sm truncate" style={{ color: 'white' }}>
          {perfil.nombre}
        </p>
        {perfil.salon && (
          <p className="text-xs truncate mt-0.5" style={{ color: 'var(--color-salon-400)' }}>
            {perfil.salon.nombre}
          </p>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                active
                  ? 'font-medium'
                  : 'opacity-70 hover:opacity-100'
              )}
              style={active
                ? { background: 'var(--color-salon-700)', color: 'white' }
                : { color: 'var(--color-salon-200)' }
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t" style={{ borderColor: 'var(--color-salon-800)' }}>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full transition-all opacity-70 hover:opacity-100"
          style={{ color: 'var(--color-salon-200)' }}
        >
          <span>⎋</span>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
