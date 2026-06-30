import { requireRol } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/layout/PageHeader'
import CitasEstilista from './CitasEstilista'
import type { Cita, Turno } from '@/types'

export const metadata = { title: 'Mis citas' }

export default async function EstilistaPage() {
  const perfil = await requireRol('estilista')
  const supabase = await createClient()
  const salonId = perfil.salon_id!

  // Verificar turno activo
  const { data: turno } = await supabase
    .from('turnos')
    .select('*')
    .eq('salon_id', salonId)
    .eq('activo', true)
    .single() as { data: Turno | null }

  // Citas activas del estilista (hoy y futuras pendientes/en_curso)
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  const { data: citas } = await supabase
    .from('citas')
    .select('*, cliente:clientes(*), servicio:servicios(*)')
    .eq('salon_id', salonId)
    .eq('estilista_id', perfil.id)
    .eq('activo', true)
    .in('estado', ['confirmada', 'en_curso'])
    .gte('fecha_hora', hoy.toISOString())
    .order('fecha_hora') as { data: Cita[] | null }

  // Citas completadas de hoy (para ver qué se cobró)
  const finDia = new Date()
  finDia.setHours(23, 59, 59, 999)

  const { data: completadas } = await supabase
    .from('citas')
    .select('*, cliente:clientes(*), servicio:servicios(*)')
    .eq('salon_id', salonId)
    .eq('estilista_id', perfil.id)
    .eq('estado', 'completada')
    .gte('fecha_hora', hoy.toISOString())
    .lte('fecha_hora', finDia.toISOString())
    .order('fecha_hora', { ascending: false }) as { data: Cita[] | null }

  return (
    <div>
      <PageHeader
        title={`Hola, ${perfil.nombre} 👋`}
        subtitle={turno ? '🟢 Local abierto' : '⚫ Local cerrado — la caja no está disponible'}
      />
      <div className="p-8">
        <CitasEstilista
          citas={citas ?? []}
          completadas={completadas ?? []}
          turnoActivo={!!turno}
          estilistaId={perfil.id}
          salonId={salonId}
        />
      </div>
    </div>
  )
}
