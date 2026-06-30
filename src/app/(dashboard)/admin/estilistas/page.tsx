import { requireRol } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/layout/PageHeader'
import EstilistasTable from './EstilistasTable'
import type { Perfil } from '@/types'

export const metadata = { title: 'Estilistas' }

export default async function EstilistasPage() {
  const perfil = await requireRol('admin', 'propietaria')
  const supabase = await createClient()

  const { data: estilistas } = await supabase
    .from('perfiles')
    .select('*')
    .eq('salon_id', perfil.salon_id!)
    .eq('rol', 'estilista')
    .order('nombre') as { data: Perfil[] | null }

  return (
    <div>
      <PageHeader title="Estilistas" subtitle="Gestión del equipo" />
      <div className="p-8">
        <EstilistasTable estilistas={estilistas ?? []} salonId={perfil.salon_id!} />
      </div>
    </div>
  )
}
