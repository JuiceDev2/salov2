import { requireRol } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/layout/PageHeader'
import type { ActividadLog } from '@/types'
import { formatFecha } from '@/lib/utils'

export const metadata = { title: 'Registro de actividad' }

const ACCION_LABELS: Record<string, string> = {
  turno_abierto:     '🟢 Turno abierto',
  turno_cerrado:     '⚫ Turno cerrado',
  cita_completada:   '✅ Cita completada',
  cobro_registrado:  '💵 Cobro registrado',
  cita_creada_local: '📋 Cita local creada',
}

export default async function ActividadPage() {
  const perfil = await requireRol('admin', 'propietaria')
  const supabase = await createClient()

  const { data: logs } = await supabase
    .from('actividad_log')
    .select('*, usuario:perfiles(nombre, rol)')
    .eq('salon_id', perfil.salon_id!)
    .order('created_at', { ascending: false })
    .limit(200) as { data: ActividadLog[] | null }

  return (
    <div>
      <PageHeader title="Registro de actividad" subtitle="Rastro auditable de todas las acciones" />
      <div className="p-8">
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead style={{ background: 'var(--color-warm-100)' }}>
              <tr className="text-left">
                {['Fecha y hora', 'Usuario', 'Acción', 'Detalle'].map(h => (
                  <th key={h} className="px-4 py-3 font-medium text-xs uppercase tracking-wide"
                      style={{ color: 'var(--color-warm-600)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--color-warm-200)' }}>
              {(logs ?? []).map(log => (
                <tr key={log.id}>
                  <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--color-warm-500)' }}>
                    {formatFecha(log.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{log.usuario?.nombre ?? '—'}</p>
                    <p className="text-xs" style={{ color: 'var(--color-warm-500)' }}>
                      {log.rol_usuario}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {ACCION_LABELS[log.accion] ?? log.accion}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-warm-500)' }}>
                    {log.detalle ? JSON.stringify(log.detalle) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!logs || logs.length === 0) && (
            <p className="text-sm text-center py-10" style={{ color: 'var(--color-warm-400)' }}>
              Sin actividad registrada
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
