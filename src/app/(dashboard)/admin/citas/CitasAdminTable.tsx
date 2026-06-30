'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import toast from 'react-hot-toast'
import type { Cita, Perfil, Servicio } from '@/types'
import { formatFecha, formatPeso, ESTADO_LABELS, ESTADO_COLORS, cn } from '@/lib/utils'

interface Props {
  citas: Cita[]
  estilistas: Perfil[]
  servicios: Servicio[]
  salonId: string
}

type Filtro = 'todas' | 'confirmada' | 'en_curso' | 'completada' | 'cancelada'

export default function CitasAdminTable({ citas, estilistas, servicios, salonId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [cancelingId, setCancelingId] = useState<string | null>(null)

  const filtradas = filtro === 'todas' ? citas : citas.filter(c => c.estado === filtro)

  async function cancelarCita(cita: Cita) {
    if (!confirm(`¿Cancelar la cita de ${cita.cliente?.nombre}?`)) return
    setCancelingId(cita.id)

    const { error } = await supabase
      .from('citas')
      .update({ estado: 'cancelada' })
      .eq('id', cita.id)

    setCancelingId(null)
    if (error) { toast.error('Error al cancelar'); return }
    toast.success('Cita cancelada')
    router.refresh()
  }

  const filtros: { key: Filtro; label: string }[] = [
    { key: 'todas',      label: 'Todas' },
    { key: 'confirmada', label: 'Confirmadas' },
    { key: 'en_curso',   label: 'En curso' },
    { key: 'completada', label: 'Completadas' },
    { key: 'cancelada',  label: 'Canceladas' },
  ]

  return (
    <div className="space-y-4">

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {filtros.map(f => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
              filtro === f.key
                ? 'border-transparent'
                : 'bg-white border-warm-300 hover:bg-warm-100'
            )}
            style={filtro === f.key
              ? { background: 'var(--color-salon-700)', color: 'white', borderColor: 'var(--color-salon-700)' }
              : { color: 'var(--color-warm-700)' }
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead style={{ background: 'var(--color-warm-100)' }}>
            <tr className="text-left">
              {['Fecha y hora', 'Cliente', 'Servicio', 'Estilista', 'Origen', 'Estado', 'Acciones'].map(h => (
                <th key={h} className="px-4 py-3 font-medium text-xs uppercase tracking-wide"
                    style={{ color: 'var(--color-warm-600)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--color-warm-200)' }}>
            {filtradas.map(c => (
              <tr key={c.id} className={cn(c.estado === 'cancelada' && 'opacity-50')}>
                <td className="px-4 py-3 font-mono text-xs">{formatFecha(c.fecha_hora)}</td>
                <td className="px-4 py-3">
                  <p className="font-medium">{c.cliente?.nombre}</p>
                  <p className="text-xs" style={{ color: 'var(--color-warm-500)' }}>{c.cliente?.telefono}</p>
                </td>
                <td className="px-4 py-3">
                  <p>{c.servicio?.nombre}</p>
                  <p className="text-xs" style={{ color: 'var(--color-salon-600)' }}>
                    {formatPeso(c.servicio?.precio ?? 0)}
                  </p>
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--color-warm-600)' }}>
                  {c.estilista?.nombre ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={cn('badge text-xs', c.origen === 'local'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-blue-100 text-blue-700')}>
                    {c.origen === 'local' ? 'Local' : 'Internet'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('badge', ESTADO_COLORS[c.estado])}>
                    {ESTADO_LABELS[c.estado]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {!['cancelada', 'completada'].includes(c.estado) && (
                    <button
                      className="btn-danger text-xs px-3 py-1.5"
                      onClick={() => cancelarCita(c)}
                      disabled={cancelingId === c.id}
                    >
                      {cancelingId === c.id ? '…' : 'Cancelar'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtradas.length === 0 && (
          <p className="text-sm text-center py-10" style={{ color: 'var(--color-warm-400)' }}>
            Sin citas
          </p>
        )}
      </div>
    </div>
  )
}
