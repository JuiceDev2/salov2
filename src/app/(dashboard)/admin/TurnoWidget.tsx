'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import toast from 'react-hot-toast'
import type { Turno } from '@/types'
import { formatFecha } from '@/lib/utils'

interface Props {
  turno: Turno | null
  salonId: string
  adminId: string
}

export default function TurnoWidget({ turno, salonId, adminId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function abrirTurno() {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('turnos').insert({
      salon_id: salonId,
      admin_id: adminId,
      activo: true,
    })

    if (error) { toast.error('Error al abrir turno'); setLoading(false); return }

    await supabase.rpc('log_actividad', {
      p_salon_id: salonId, p_accion: 'turno_abierto',
      p_entidad: 'turnos', p_entidad_id: null, p_detalle: null,
    })

    toast.success('Local abierto')
    router.refresh()
    setLoading(false)
  }

  async function cerrarTurno() {
    if (!turno) return
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('turnos')
      .update({ activo: false, cierre: new Date().toISOString() })
      .eq('id', turno.id)

    if (error) { toast.error('Error al cerrar turno'); setLoading(false); return }

    await supabase.rpc('log_actividad', {
      p_salon_id: salonId, p_accion: 'turno_cerrado',
      p_entidad: 'turnos', p_entidad_id: turno.id, p_detalle: null,
    })

    toast.success('Local cerrado')
    router.refresh()
    setLoading(false)
  }

  return (
    <div
      className="rounded-xl p-5 flex items-center justify-between"
      style={{
        background: turno ? 'var(--color-success)' : 'var(--color-warm-800)',
        color: 'white',
      }}
    >
      <div>
        <p className="font-semibold text-lg">
          {turno ? '🟢 Local abierto' : '⚫ Local cerrado'}
        </p>
        {turno && (
          <p className="text-sm opacity-80 mt-0.5">
            Abierto desde {formatFecha(turno.apertura)}
          </p>
        )}
        {!turno && (
          <p className="text-sm opacity-70 mt-0.5">
            Abre el local para habilitar la caja
          </p>
        )}
      </div>

      {turno ? (
        <button
          className="btn-secondary"
          style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}
          onClick={cerrarTurno}
          disabled={loading}
        >
          {loading ? 'Cerrando…' : 'Cerrar local'}
        </button>
      ) : (
        <button
          className="btn-primary"
          style={{ background: 'white', color: 'var(--color-warm-900)' }}
          onClick={abrirTurno}
          disabled={loading}
        >
          {loading ? 'Abriendo…' : 'Abrir local'}
        </button>
      )}
    </div>
  )
}
