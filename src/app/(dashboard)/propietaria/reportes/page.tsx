import { requireRol } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/layout/PageHeader'
import ReportesView from './ReportesView'
import type { Salon } from '@/types'

export const metadata = { title: 'Reportes globales' }

export default async function ReportesPage() {
  await requireRol('propietaria')
  const supabase = await createClient()

  const { data: salones } = await supabase
    .from('salones')
    .select('*')
    .eq('activo', true)
    .order('nombre') as { data: Salon[] | null }

  // Cobros de los últimos 30 días por salón
  const hace30Dias = new Date()
  hace30Dias.setDate(hace30Dias.getDate() - 30)

  const { data: cobros } = await supabase
    .from('cobros')
    .select('salon_id, monto, fecha')
    .gte('fecha', hace30Dias.toISOString())
    .eq('activo', true)
    .order('fecha')

  // Citas por estado y salón
  const { data: citas } = await supabase
    .from('citas')
    .select('salon_id, estado, fecha_hora, origen')
    .eq('activo', true)
    .gte('fecha_hora', hace30Dias.toISOString())

  return (
    <div>
      <PageHeader title="Reportes globales" subtitle="Últimos 30 días — todos los salones" />
      <div className="p-8">
        <ReportesView
          salones={salones ?? []}
          cobros={cobros ?? []}
          citas={citas ?? []}
        />
      </div>
    </div>
  )
}
