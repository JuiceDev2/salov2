import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Perfil, Rol } from '@/types'

/**
 * IMPORTANTE: nunca usar supabase.auth.getSession() en el servidor.
 * getSession() devuelve datos del cookie sin revalidar con Supabase Auth,
 * lo que puede permitir sesiones expiradas o manipuladas.
 * getUser() siempre verifica el JWT contra Supabase Auth Server.
 * Ref: https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export async function getUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) return null
  return user
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

  return data as Perfil | null
}

export async function requireAuth(): Promise<Perfil> {
  const perfil = await getPerfil()
  if (!perfil) redirect('/login')
  if (!perfil.activo) redirect('/login?error=inactivo')
  return perfil
}

export async function requireRol(...roles: Rol[]): Promise<Perfil> {
  const perfil = await requireAuth()
  if (!roles.includes(perfil.rol)) {
    redirect(getDashboardByRol(perfil.rol))
  }
  return perfil
}

export function getDashboardByRol(rol: Rol): string {
  switch (rol) {
    case 'propietaria': return '/propietaria'
    case 'admin':       return '/admin'
    case 'estilista':   return '/estilista'
  }
}
