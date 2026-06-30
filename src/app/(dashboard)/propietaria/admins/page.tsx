import { requireRol } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/layout/PageHeader'
import type { Perfil, Salon } from '@/types'
import AdminsTable from './AdminsTable'

export const metadata = { title: 'Administradores' }

type AdminConSalon = Perfil & { salon: { nombre: string } | null }

export default async function AdminsPage() {
  await requireRol('propietaria')
  const supabase = await createClient()

  const [adminsRes, salonesRes] = await Promise.all([
    supabase
      .from('perfiles')
      .select('*, salon:salones(nombre)')
      .eq('rol', 'admin')
      .order('nombre'),
    supabase.from('salones').select('id, nombre').eq('activo', true).order('nombre'),
  ])

  const admins = adminsRes.data as AdminConSalon[] | null
  const salones = salonesRes.data as Pick<Salon, 'id' | 'nombre'>[] | null

  return (
    <div>
      <PageHeader title="Administradores" subtitle="Gestión de admins por salón" />
      <div className="p-8">
        <AdminsTable
          admins={admins ?? []}
          salones={salones ?? []}
        />
      </div>
    </div>
  )
}
