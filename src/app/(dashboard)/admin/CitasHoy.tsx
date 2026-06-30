import type { Cita } from '@/types'
import { formatHora, ESTADO_LABELS, ESTADO_COLORS } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function CitasHoy({ citas }: { citas: Cita[] }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-base" style={{ color: 'var(--color-warm-900)' }}>
          Citas de hoy
        </h2>
        <span className="text-sm" style={{ color: 'var(--color-warm-500)' }}>
          {citas.length} cita{citas.length !== 1 ? 's' : ''}
        </span>
      </div>

      {citas.length === 0 ? (
        <p className="text-sm text-center py-8" style={{ color: 'var(--color-warm-400)' }}>
          Sin citas para hoy
        </p>
      ) : (
        <div className="divide-y" style={{ borderColor: 'var(--color-warm-200)' }}>
          {citas.map(cita => (
            <div key={cita.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-4">
                <span className="text-sm font-mono font-medium w-12"
                      style={{ color: 'var(--color-salon-700)' }}>
                  {formatHora(cita.fecha_hora)}
                </span>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-warm-900)' }}>
                    {cita.cliente?.nombre}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-warm-500)' }}>
                    {cita.servicio?.nombre} · {cita.estilista?.nombre ?? 'Sin asignar'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {cita.origen === 'local' && (
                  <span className="badge text-xs" style={{ background: 'var(--color-salon-100)', color: 'var(--color-salon-700)' }}>
                    Local
                  </span>
                )}
                <span className={cn('badge', ESTADO_COLORS[cita.estado])}>
                  {ESTADO_LABELS[cita.estado]}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
