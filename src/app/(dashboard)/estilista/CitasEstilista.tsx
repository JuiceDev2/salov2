'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import toast from 'react-hot-toast'
import type { Cita } from '@/types'
import { formatFecha, formatPeso, ESTADO_COLORS, ESTADO_LABELS, cn } from '@/lib/utils'
import ModalCobro from './ModalCobro'
import ModalCitaLocal from './ModalCitaLocal'

interface Props {
  citas: Cita[]
  completadas: Cita[]
  turnoActivo: boolean
  estilistaId: string
  salonId: string
}

export default function CitasEstilista({ citas, completadas, turnoActivo, estilistaId, salonId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [citaACobrar, setCitaACobrar] = useState<Cita | null>(null)
  const [showModalLocal, setShowModalLocal] = useState(false)

  async function completarCita(cita: Cita) {
    setProcessingId(cita.id)

    const { error } = await supabase
      .from('citas')
      .update({ estado: 'completada' })
      .eq('id', cita.id)

    if (error) { toast.error('Error al completar cita'); setProcessingId(null); return }

    // Audit log
    await supabase.rpc('log_actividad', {
      p_salon_id:   salonId,
      p_accion:     'cita_completada',
      p_entidad:    'citas',
      p_entidad_id: cita.id,
      p_detalle: {
        cliente:  cita.cliente?.nombre,
        servicio: cita.servicio?.nombre,
        monto:    cita.servicio?.precio,
      },
    })

    toast.success('Cita marcada como completada')
    setProcessingId(null)
    router.refresh()
  }

  return (
    <div className="space-y-8">

      {/* Botón cita local */}
      <div className="flex justify-between items-center">
        <h2 className="font-semibold" style={{ color: 'var(--color-warm-800)' }}>
          Citas pendientes ({citas.length})
        </h2>
        <button
          className="btn-primary"
          onClick={() => setShowModalLocal(true)}
          disabled={!turnoActivo}
          title={!turnoActivo ? 'El local está cerrado' : ''}
        >
          + Servicio en local
        </button>
      </div>

      {/* Aviso local cerrado */}
      {!turnoActivo && (
        <div className="rounded-lg p-4 text-sm"
             style={{ background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e' }}>
          ⚠ El local está cerrado. El administrador debe abrirlo para habilitar cobros y servicios locales.
        </div>
      )}

      {/* Lista de citas pendientes */}
      {citas.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-3xl mb-3">📅</p>
          <p style={{ color: 'var(--color-warm-500)' }}>Sin citas pendientes por ahora</p>
        </div>
      ) : (
        <div className="space-y-3">
          {citas.map(cita => (
            <div key={cita.id} className="card flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-center w-14">
                  <p className="text-lg font-bold font-mono" style={{ color: 'var(--color-salon-700)' }}>
                    {new Date(cita.fecha_hora).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-warm-500)' }}>
                    {new Date(cita.fecha_hora).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
                <div>
                  <p className="font-semibold">{cita.cliente?.nombre}</p>
                  <p className="text-sm" style={{ color: 'var(--color-warm-500)' }}>
                    {cita.servicio?.nombre} · {formatPeso(cita.servicio?.precio ?? 0)}
                  </p>
                  {cita.notas && (
                    <p className="text-xs mt-1 italic" style={{ color: 'var(--color-warm-500)' }}>
                      {cita.notas}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={cn('badge', ESTADO_COLORS[cita.estado])}>
                  {ESTADO_LABELS[cita.estado]}
                </span>
                <button
                  className="btn-primary text-sm px-4 py-2"
                  onClick={() => completarCita(cita)}
                  disabled={processingId === cita.id}
                >
                  {processingId === cita.id ? '…' : '✓ Completar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Completadas de hoy — listas para cobrar */}
      {completadas.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3" style={{ color: 'var(--color-warm-800)' }}>
            Completadas hoy — cobrar
          </h2>
          <div className="space-y-3">
            {completadas.map(cita => (
              <div key={cita.id} className="card flex items-center justify-between gap-4"
                   style={{ borderColor: 'var(--color-salon-200)', background: 'var(--color-salon-50)' }}>
                <div>
                  <p className="font-semibold">{cita.cliente?.nombre}</p>
                  <p className="text-sm" style={{ color: 'var(--color-warm-500)' }}>
                    {cita.servicio?.nombre} · {formatPeso(cita.servicio?.precio ?? 0)}
                  </p>
                </div>
                <button
                  className="btn-primary text-sm px-4 py-2"
                  onClick={() => setCitaACobrar(cita)}
                  disabled={!turnoActivo}
                >
                  💵 Cobrar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal cobro */}
      {citaACobrar && (
        <ModalCobro
          cita={citaACobrar}
          estilistaId={estilistaId}
          salonId={salonId}
          onClose={() => setCitaACobrar(null)}
          onSuccess={() => { setCitaACobrar(null); router.refresh() }}
        />
      )}

      {/* Modal cita local */}
      {showModalLocal && (
        <ModalCitaLocal
          estilistaId={estilistaId}
          salonId={salonId}
          onClose={() => setShowModalLocal(false)}
          onSuccess={() => { setShowModalLocal(false); router.refresh() }}
        />
      )}
    </div>
  )
}
