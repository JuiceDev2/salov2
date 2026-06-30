'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import toast from 'react-hot-toast'
import type { Cliente, Cita, Servicio } from '@/types'
import { formatFecha, formatFechaCorta, ESTADO_COLORS, ESTADO_LABELS, cn } from '@/lib/utils'

type UltimaCita = Partial<Cita> & { servicio?: Partial<Servicio> }

interface Props {
  clientes: Cliente[]
  ultimaCitaMap: Record<string, UltimaCita>
  salonId: string
}

export default function ClientesTable({ clientes, ultimaCitaMap, salonId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [busqueda, setBusqueda] = useState('')
  const [filtroActivo, setFiltroActivo] = useState<'todos' | 'activos' | 'inactivos'>('activos')
  const [editNotasId, setEditNotasId] = useState<string | null>(null)
  const [notas, setNotas] = useState('')
  const [saving, setSaving] = useState(false)

  const filtrados = clientes.filter(c => {
    const matchBusqueda =
      c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      c.telefono.includes(busqueda)
    const matchActivo =
      filtroActivo === 'todos' ? true :
      filtroActivo === 'activos' ? c.activo :
      !c.activo
    return matchBusqueda && matchActivo
  })

  async function toggleActivo(c: Cliente) {
    const { error } = await supabase
      .from('clientes')
      .update({ activo: !c.activo })
      .eq('id', c.id)

    if (error) { toast.error('Error al actualizar'); return }
    toast.success(c.activo ? 'Cliente desactivado' : 'Cliente activado')
    router.refresh()
  }

  async function guardarNotas(id: string) {
    setSaving(true)
    const { error } = await supabase
      .from('clientes')
      .update({ notas })
      .eq('id', id)

    setSaving(false)
    if (error) { toast.error('Error al guardar notas'); return }
    toast.success('Notas guardadas')
    setEditNotasId(null)
    router.refresh()
  }

  function startEditNotas(c: Cliente) {
    setEditNotasId(c.id)
    setNotas(c.notas ?? '')
  }

  return (
    <div className="space-y-4">

      {/* Barra de búsqueda y filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          className="input flex-1"
          placeholder="Buscar por nombre o teléfono…"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
        <div className="flex gap-2">
          {(['activos', 'inactivos', 'todos'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFiltroActivo(f)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium border transition-all capitalize',
                filtroActivo === f
                  ? 'text-white border-transparent'
                  : 'bg-white hover:bg-warm-100'
              )}
              style={filtroActivo === f
                ? { background: 'var(--color-salon-700)', borderColor: 'var(--color-salon-700)' }
                : { color: 'var(--color-warm-700)', borderColor: 'var(--color-warm-300)' }
              }
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm" style={{ color: 'var(--color-warm-500)' }}>
        {filtrados.length} resultado{filtrados.length !== 1 ? 's' : ''}
      </p>

      {/* Tabla */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead style={{ background: 'var(--color-warm-100)' }}>
            <tr className="text-left">
              {['Cliente', 'Teléfono', 'Registrado', 'Última cita', 'Notas', 'Estado', 'Acciones'].map(h => (
                <th key={h} className="px-4 py-3 font-medium text-xs uppercase tracking-wide"
                    style={{ color: 'var(--color-warm-600)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--color-warm-200)' }}>
            {filtrados.map(c => {
              const ultima = ultimaCitaMap[c.id]
              return (
                <tr key={c.id} className={cn(!c.activo && 'opacity-50')}>

                  {/* Nombre */}
                  <td className="px-4 py-3 font-medium">{c.nombre}</td>

                  {/* Teléfono */}
                  <td className="px-4 py-3">
                    <a
                      href={`tel:${c.telefono}`}
                      className="hover:underline"
                      style={{ color: 'var(--color-salon-600)' }}
                    >
                      {c.telefono}
                    </a>
                  </td>

                  {/* Registrado */}
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-warm-500)' }}>
                    {formatFechaCorta(c.created_at)}
                  </td>

                  {/* Última cita */}
                  <td className="px-4 py-3">
                    {ultima ? (
                      <div>
                        <p className="text-xs">{ultima.servicio?.nombre}</p>
                        <p className="text-xs" style={{ color: 'var(--color-warm-400)' }}>
                          {formatFecha(ultima.fecha_hora!)}
                        </p>
                        <span className={cn('badge text-xs mt-1', ESTADO_COLORS[ultima.estado!])}>
                          {ESTADO_LABELS[ultima.estado!]}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--color-warm-400)' }}>Sin citas</span>
                    )}
                  </td>

                  {/* Notas */}
                  <td className="px-4 py-3 max-w-[200px]">
                    {editNotasId === c.id ? (
                      <div className="flex gap-2 items-start">
                        <textarea
                          className="input text-xs"
                          rows={2}
                          value={notas}
                          onChange={e => setNotas(e.target.value)}
                          style={{ resize: 'none', minWidth: '120px' }}
                          autoFocus
                        />
                        <div className="flex flex-col gap-1">
                          <button
                            className="btn-primary text-xs px-2 py-1"
                            onClick={() => guardarNotas(c.id)}
                            disabled={saving}
                          >
                            {saving ? '…' : '✓'}
                          </button>
                          <button
                            className="btn-ghost text-xs px-2 py-1"
                            onClick={() => setEditNotasId(null)}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        className="text-xs text-left w-full"
                        style={{ color: c.notas ? 'var(--color-warm-700)' : 'var(--color-warm-400)' }}
                        onClick={() => startEditNotas(c)}
                      >
                        {c.notas ?? '+ Agregar notas'}
                      </button>
                    )}
                  </td>

                  {/* Estado */}
                  <td className="px-4 py-3">
                    <span className={cn('badge', c.activo
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-600')}>
                      {c.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>

                  {/* Acciones */}
                  <td className="px-4 py-3">
                    <button
                      className={cn(
                        'text-xs px-3 py-1.5 rounded-lg border font-medium transition-all',
                        c.activo
                          ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                          : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                      )}
                      onClick={() => toggleActivo(c)}
                    >
                      {c.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {filtrados.length === 0 && (
          <p className="text-sm text-center py-10" style={{ color: 'var(--color-warm-400)' }}>
            {busqueda ? `Sin resultados para "${busqueda}"` : 'Sin clientes registrados'}
          </p>
        )}
      </div>
    </div>
  )
}
