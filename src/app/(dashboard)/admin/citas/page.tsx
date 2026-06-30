import { requireRol } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/layout/PageHeader'
import CitasAdminTable from './CitasAdminTable'
import type { Cita, Perfil, Servicio } from '@/types'

export const metadata = { title: 'Citas' }

export default async function AdminCitasPage() {
  const perfil = await requireRol('admin', 'propietaria')
  const supabase = await createClient()
  const salonId = perfil.salon_id!

  const [
    { data: citas },
    { data: estilistas },
    { data: servicios },
  ] = await Promise.all([
    supabase
      .from('citas')
      .select('*, cliente:clientes(*), estilista:perfiles(id,nombre), servicio:servicios(id,nombre,precio)')
      .eq('salon_id', salonId)
      .eq('activo', true)
      .order('fecha_hora', { ascending: false })
      .limit(100),
    supabase.from('perfiles').select('id, nombre').eq('salon_id', salonId).eq('rol', 'estilista').eq('activo', true),
    supabase.from('servicios').select('id, nombre, precio').eq('salon_id', salonId).eq('activo', true),
  ])

  return (
    <div>
      <PageHeader title="Citas" subtitle="Todas las citas del salón" />
      <div className="p-8">
        <CitasAdminTable
          citas={(citas as Cita[]) ?? []}
          estilistas={(estilistas as Perfil[]) ?? []}
          servicios={(servicios as Servicio[]) ?? []}
          salonId={salonId}
        />
      </div>
    </div>
  )
}
