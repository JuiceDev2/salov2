import { requireRol } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/layout/PageHeader'
import ServiciosTable from './ServiciosTable'
import type { Servicio } from '@/types'

export const metadata = { title: 'Servicios' }

export default async function ServiciosPage() {
  const perfil = await requireRol('admin', 'propietaria')
  const supabase = await createClient()

  const { data: servicios } = await supabase
    .from('servicios')
    .select('*')
    .eq('salon_id', perfil.salon_id!)
    .order('nombre') as { data: Servicio[] | null }

  return (
    <div>
      <PageHeader title="Servicios" subtitle="Precios, duración y estado" />
      <div className="p-8">
        <ServiciosTable servicios={servicios ?? []} salonId={perfil.salon_id!} />
      </div>
    </div>
  )
}
