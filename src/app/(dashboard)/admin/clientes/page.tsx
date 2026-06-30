import { requireRol } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/layout/PageHeader'
import ClientesTable from './ClientesTable'
import type { Cliente, Cita } from '@/types'

export const metadata = { title: 'Clientes' }

export default async function ClientesPage() {
  const perfil = await requireRol('admin', 'propietaria')
  const supabase = await createClient()
  const salonId = perfil.salon_id!

  const { data: clientes } = await supabase
    .from('clientes')
    .select('*')
    .eq('salon_id', salonId)
    .order('nombre') as { data: Cliente[] | null }

  // Última cita por cliente para mostrar actividad
  const { data: ultimasCitas } = await supabase
    .from('citas')
    .select('cliente_id, fecha_hora, estado, servicio:servicios(nombre)')
    .eq('salon_id', salonId)
    .eq('activo', true)
    .order('fecha_hora', { ascending: false }) as { data: (Cita & { servicio: { nombre: string } })[] | null }

  // Construir mapa cliente_id → última cita
  const ultimaCitaMap: Record<string, (typeof ultimasCitas)[0]> = {}
  for (const cita of ultimasCitas ?? []) {
    if (!ultimaCitaMap[cita.cliente_id]) {
      ultimaCitaMap[cita.cliente_id] = cita
    }
  }

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle={`${(clientes ?? []).length} clientes registrados`}
      />
      <div className="p-8">
        <ClientesTable
          clientes={clientes ?? []}
          ultimaCitaMap={ultimaCitaMap}
          salonId={salonId}
        />
      </div>
    </div>
  )
}
