import { createClient } from '@/lib/supabase/client'
import { redirect } from 'next/navigation'

export type Rol = 'propietaria' | 'admin' | 'estilista'

export async function getUser() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  return user
}

export async function getPerfil() {
  const supabase = createClient()
  const user = await getUser()

  if (!user) return null

  const { data } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return data
}

export function getDashboardByRol(rol: Rol) {
  switch (rol) {
    case 'admin':
      return '/admin'
    case 'propietaria':
      return '/propietaria'
    case 'estilista':
      return '/estilista'
    default:
      return '/'
  }
}