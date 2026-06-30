import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Perfil, Rol } from '@/types'

export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user ?? null
}

export async function getPerfil(): Promise<Perfil | null> {
  const supabase = await createClient()
  const user = await getUser()
  if (!user) return null

  const { data } = await supabase
    .from('perfiles')
    .select('*, salon:salones(*)')
    .eq('id', user.id)
    .single()

  return data ?? null
}

export async function requireAuth() {
  const perfil = await getPerfil()

  if (!perfil) redirect('/login')
  if (!perfil.activo) redirect('/login?error=inactivo')

  return perfil
}

export async function requireRol(...roles: Rol[]) {
  const perfil = await requireAuth()

  if (!roles.includes(perfil.rol)) {
    redirect(getDashboardByRol(perfil.rol))
  }

  return perfil
}

export function getDashboardByRol(rol: Rol): string {
  switch (rol) {
    case 'propietaria':
      return '/propietaria'
    case 'admin':
      return '/admin'
    case 'estilista':
      return '/estilista'
    default:
      return '/login'
  }
}