import { requireRol } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/layout/PageHeader'
import type { Salon } from '@/types'
import { formatPeso } from '@/lib/utils'
import Link from 'next/link'

export const metadata = { title: 'Panel Propietaria' }

export default async function PropietariaPage() {
  await requireRol('propietaria')
  const supabase = await createClient()

  const { data: salones } = await supabase
    .from('salones')
    .select('*')
    .order('nombre') as { data: Salon[] | null }

  const hoy = new Date()
  const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString()

  // Stats por salón
  const statsPromises = (salones ?? []).map(async salon => {
    const [
      { count: totalCitas },
      { data: cobros },
      { count: clientes },
      { count: estilistas },
    ] = await Promise.all([
      supabase.from('citas').select('*', { count: 'exact', head: true }).eq('salon_id', salon.id),
      supabase.from('cobros').select('monto').eq('salon_id', salon.id).gte('fecha', inicioMes),
      supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('salon_id', salon.id).eq('activo', true),
      supabase.from('perfiles').select('*', { count: 'exact', head: true }).eq('salon_id', salon.id).eq('rol', 'estilista').eq('activo', true),
    ])
    const ingresosMes = cobros?.reduce((s, c) => s + Number(c.monto), 0) ?? 0
    return { salon, totalCitas: totalCitas ?? 0, ingresosMes, clientes: clientes ?? 0, estilistas: estilistas ?? 0 }
  })

  const stats = await Promise.all(statsPromises)
  const ingresosTotal = stats.reduce((s, r) => s + r.ingresosMes, 0)

  return (
    <div>
      <PageHeader title="Panel Global" subtitle="Vista de todos los salones" />
      <div className="p-8 space-y-8">

        {/* Resumen global */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Salones activos',      value: (salones ?? []).filter(s => s.activo).length.toString(), icon: '🏪' },
            { label: 'Ingresos del mes',     value: formatPeso(ingresosTotal),                               icon: '💵' },
            { label: 'Total estilistas',     value: stats.reduce((s, r) => s + r.estilistas, 0).toString(),  icon: '💄' },
            { label: 'Total clientes',       value: stats.reduce((s, r) => s + r.clientes, 0).toString(),    icon: '👥' },
          ].map(s => (
            <div key={s.label} className="card">
              <p className="text-2xl mb-2">{s.icon}</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-salon-800)' }}>{s.value}</p>
              <p className="text-sm mt-1" style={{ color: 'var(--color-warm-500)' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Por salón */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold" style={{ color: 'var(--color-warm-800)' }}>Por salón</h2>
            <Link href="/propietaria/salones" className="btn-primary text-sm">
              + Nuevo salón
            </Link>
          </div>

          <div className="space-y-4">
            {stats.map(({ salon, totalCitas, ingresosMes, clientes, estilistas }) => (
              <div key={salon.id} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-base">{salon.nombre}</h3>
                      <span className={`badge text-xs ${salon.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {salon.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    {salon.direccion && (
                      <p className="text-sm" style={{ color: 'var(--color-warm-500)' }}>{salon.direccion}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-warm-200)' }}>
                  {[
                    { label: 'Ingresos mes', value: formatPeso(ingresosMes) },
                    { label: 'Total citas',  value: totalCitas.toString() },
                    { label: 'Clientes',     value: clientes.toString() },
                    { label: 'Estilistas',   value: estilistas.toString() },
                  ].map(s => (
                    <div key={s.label}>
                      <p className="font-bold" style={{ color: 'var(--color-salon-700)' }}>{s.value}</p>
                      <p className="text-xs" style={{ color: 'var(--color-warm-500)' }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
