import { requireRol } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/layout/PageHeader'
import SalonesManager from './SalonesManager'
import type { Salon, Perfil } from '@/types'

export const metadata = { title: 'Salones' }

export default async function SalonesPage() {
  await requireRol('propietaria')
  const supabase = await createClient()

  const { data: salones } = await supabase
    .from('salones')
    .select('*')
    .order('nombre') as { data: Salon[] | null }

  const { data: admins } = await supabase
    .from('perfiles')
    .select('*')
    .eq('rol', 'admin')
    .order('nombre') as { data: Perfil[] | null }

  return (
    <div>
      <PageHeader title="Salones" subtitle="Gestión de sucursales y administradores" />
      <div className="p-8">
        <SalonesManager salones={salones ?? []} admins={admins ?? []} />
      </div>
    </div>
  )
}
