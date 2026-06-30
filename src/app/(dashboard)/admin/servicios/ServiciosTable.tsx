'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import toast from 'react-hot-toast'
import type { Servicio, NuevoServicioForm } from '@/types'
import { formatPeso } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Props {
  servicios: Servicio[]
  salonId: string
}

const EMPTY_FORM: NuevoServicioForm = { nombre: '', descripcion: '', duracion_min: 60, precio: 0 }

export default function ServiciosTable({ servicios, salonId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [editId, setEditId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Servicio>>({})
  const [showForm, setShowForm] = useState(false)
  const [newForm, setNewForm] = useState<NuevoServicioForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  // ── Toggle activo ──────────────────────────────────────
  async function toggleActivo(s: Servicio) {
    const { error } = await supabase
      .from('servicios')
      .update({ activo: !s.activo })
      .eq('id', s.id)

    if (error) { toast.error('Error al actualizar'); return }
    toast.success(s.activo ? 'Servicio desactivado' : 'Servicio activado')
    router.refresh()
  }

  // ── Edición inline ─────────────────────────────────────
  function startEdit(s: Servicio) {
    setEditId(s.id)
    setEditData({ nombre: s.nombre, descripcion: s.descripcion, duracion_min: s.duracion_min, precio: s.precio })
  }

  async function saveEdit(id: string) {
    setSaving(true)
    const { error } = await supabase
      .from('servicios')
      .update({
        nombre:       editData.nombre,
        descripcion:  editData.descripcion,
        duracion_min: Number(editData.duracion_min),
        precio:       Number(editData.precio),
      })
      .eq('id', id)

    setSaving(false)
    if (error) { toast.error('Error al guardar'); return }
    toast.success('Servicio actualizado')
    setEditId(null)
    router.refresh()
  }

  // ── Nuevo servicio ─────────────────────────────────────
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('servicios').insert({
      salon_id:     salonId,
      nombre:       newForm.nombre,
      descripcion:  newForm.descripcion || null,
      duracion_min: Number(newForm.duracion_min),
      precio:       Number(newForm.precio),
      activo:       true,
    })

    setSaving(false)
    if (error) { toast.error('Error al crear servicio'); return }
    toast.success('Servicio creado')
    setNewForm(EMPTY_FORM)
    setShowForm(false)
    router.refresh()
  }

  return (
    <div className="space-y-4">

      {/* Botón agregar */}
      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancelar' : '+ Nuevo servicio'}
        </button>
      </div>

      {/* Formulario nuevo servicio */}
      {showForm && (
        <form onSubmit={handleAdd} className="card grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="label">Nombre *</label>
            <input className="input" required placeholder="Ej. Corte"
              value={newForm.nombre} onChange={e => setNewForm(p => ({ ...p, nombre: e.target.value }))} />
          </div>
          <div>
            <label className="label">Descripción</label>
            <input className="input" placeholder="Opcional"
              value={newForm.descripcion ?? ''} onChange={e => setNewForm(p => ({ ...p, descripcion: e.target.value }))} />
          </div>
          <div>
            <label className="label">Duración (min) *</label>
            <input className="input" type="number" min={5} required
              value={newForm.duracion_min} onChange={e => setNewForm(p => ({ ...p, duracion_min: +e.target.value }))} />
          </div>
          <div>
            <label className="label">Precio (MXN) *</label>
            <input className="input" type="number" min={0} step="0.01" required
              value={newForm.precio} onChange={e => setNewForm(p => ({ ...p, precio: +e.target.value }))} />
          </div>
          <div className="col-span-2 md:col-span-4 flex justify-end">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Guardando…' : 'Agregar servicio'}
            </button>
          </div>
        </form>
      )}

      {/* Tabla */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead style={{ background: 'var(--color-warm-100)' }}>
            <tr className="text-left">
              {['Servicio', 'Descripción', 'Duración', 'Precio', 'Estado', 'Acciones'].map(h => (
                <th key={h} className="px-4 py-3 font-medium text-xs uppercase tracking-wide"
                    style={{ color: 'var(--color-warm-600)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--color-warm-200)' }}>
            {servicios.map(s => (
              <tr key={s.id} className={cn('transition-colors', !s.activo && 'opacity-50')}>

                {/* Nombre */}
                <td className="px-4 py-3">
                  {editId === s.id
                    ? <input className="input" value={editData.nombre ?? ''}
                        onChange={e => setEditData(p => ({ ...p, nombre: e.target.value }))} />
                    : <span className="font-medium">{s.nombre}</span>
                  }
                </td>

                {/* Descripción */}
                <td className="px-4 py-3" style={{ color: 'var(--color-warm-500)' }}>
                  {editId === s.id
                    ? <input className="input" value={editData.descripcion ?? ''}
                        onChange={e => setEditData(p => ({ ...p, descripcion: e.target.value }))} />
                    : s.descripcion ?? '—'
                  }
                </td>

                {/* Duración */}
                <td className="px-4 py-3">
                  {editId === s.id
                    ? <input className="input w-24" type="number" min={5} value={editData.duracion_min ?? ''}
                        onChange={e => setEditData(p => ({ ...p, duracion_min: +e.target.value }))} />
                    : `${s.duracion_min} min`
                  }
                </td>

                {/* Precio */}
                <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-salon-700)' }}>
                  {editId === s.id
                    ? <input className="input w-28" type="number" min={0} step="0.01" value={editData.precio ?? ''}
                        onChange={e => setEditData(p => ({ ...p, precio: +e.target.value }))} />
                    : formatPeso(s.precio)
                  }
                </td>

                {/* Estado */}
                <td className="px-4 py-3">
                  <span className={cn('badge', s.activo
                    ? 'bg-green-100 text-green-700'
                    : 'bg-warm-200 text-warm-500')}>
                    {s.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>

                {/* Acciones */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {editId === s.id ? (
                      <>
                        <button className="btn-primary text-xs px-3 py-1.5" onClick={() => saveEdit(s.id)} disabled={saving}>
                          {saving ? '…' : 'Guardar'}
                        </button>
                        <button className="btn-ghost text-xs px-3 py-1.5" onClick={() => setEditId(null)}>
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="btn-secondary text-xs px-3 py-1.5" onClick={() => startEdit(s)}>
                          Editar
                        </button>
                        <button
                          className={cn('text-xs px-3 py-1.5 rounded-lg border font-medium transition-all', s.activo
                            ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                            : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                          )}
                          onClick={() => toggleActivo(s)}
                        >
                          {s.activo ? 'Desactivar' : 'Activar'}
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {servicios.length === 0 && (
          <p className="text-sm text-center py-10" style={{ color: 'var(--color-warm-400)' }}>
            No hay servicios. Agrega el primero.
          </p>
        )}
      </div>
    </div>
  )
}
