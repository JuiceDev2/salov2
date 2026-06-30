import { requireRol } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/layout/PageHeader'
import type { Perfil, Salon } from '@/types'
import AdminsTable from './AdminsTable'

export const metadata = { title: 'Administradores' }

export default async function AdminsPage() {
  await requireRol('propietaria')
  const supabase = await createClient()

  const [{ data: admins }, { data: salones }] = await Promise.all([
    supabase
      .from('perfiles')
      .select('*, salon:salones(nombre)')
      .eq('rol', 'admin')
      .order('nombre') as Promise<{ data: (Perfil & { salon: { nombre: string } | null })[] | null }>,
    supabase.from('salones').select('id, nombre').eq('activo', true).order('nombre'),
  ])

  return (
    <div>
      <PageHeader title="Administradores" subtitle="Gestión de admins por salón" />
      <div className="p-8">
        <AdminsTable
          admins={admins ?? []}
          salones={(salones as Pick<Salon, 'id' | 'nombre'>[]) ?? []}
        />
      </div>
    </div>
  )
}
