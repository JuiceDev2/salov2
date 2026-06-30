import { requireRol } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/layout/PageHeader'
import TurnoWidget from './TurnoWidget'
import StatsGrid from './StatsGrid'
import CitasHoy from './CitasHoy'
import type { Turno, Cita } from '@/types'

export const metadata = { title: 'Dashboard Admin' }

export default async function AdminPage() {
  const perfil = await requireRol('admin', 'propietaria')
  const supabase = await createClient()
  const salonId = perfil.salon_id!

  // Turno activo
  const { data: turno } = await supabase
    .from('turnos')
    .select('*, admin:perfiles(nombre)')
    .eq('salon_id', salonId)
    .eq('activo', true)
    .single() as { data: Turno | null }

  // Stats del día
  const hoy = new Date()
  const inicioDia = new Date(hoy.setHours(0, 0, 0, 0)).toISOString()
  const finDia    = new Date(hoy.setHours(23, 59, 59, 999)).toISOString()

  const [
    { count: totalClientes },
    { count: citasHoy },
    { data: cobrosHoy },
    { count: citasPendientes },
  ] = await Promise.all([
    supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('salon_id', salonId).eq('activo', true),
    supabase.from('citas').select('*', { count: 'exact', head: true }).eq('salon_id', salonId).gte('fecha_hora', inicioDia).lte('fecha_hora', finDia),
    supabase.from('cobros').select('monto').eq('salon_id', salonId).gte('fecha', inicioDia).lte('fecha', finDia),
    supabase.from('citas').select('*', { count: 'exact', head: true }).eq('salon_id', salonId).eq('estado', 'confirmada'),
  ])

  const ingresosDia = cobrosHoy?.reduce((sum, c) => sum + Number(c.monto), 0) ?? 0

  // Citas de hoy con joins
  const { data: citas } = await supabase
    .from('citas')
    .select('*, cliente:clientes(*), servicio:servicios(*), estilista:perfiles(nombre)')
    .eq('salon_id', salonId)
    .gte('fecha_hora', inicioDia)
    .lte('fecha_hora', finDia)
    .order('fecha_hora') as { data: Cita[] | null }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={perfil.salon?.nombre}
      />

      <div className="p-8 space-y-8">

        {/* Turno */}
        <TurnoWidget turno={turno} salonId={salonId} adminId={perfil.id} />

        {/* Stats */}
        <StatsGrid
          totalClientes={totalClientes ?? 0}
          citasHoy={citasHoy ?? 0}
          ingresosDia={ingresosDia}
          citasPendientes={citasPendientes ?? 0}
        />

        {/* Citas de hoy */}
        <CitasHoy citas={citas ?? []} />
      </div>
    </div>
  )
}
