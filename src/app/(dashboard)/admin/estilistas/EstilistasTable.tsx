'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import toast from 'react-hot-toast'
import type { Perfil } from '@/types'
import { telefonoToEmail, formatFechaCorta } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Props {
  estilistas: Perfil[]
  salonId: string
}

export default function EstilistasTable({ estilistas, salonId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nombre: '', telefono: '' })
  const [saving, setSaving] = useState(false)
  const [resettingId, setResettingId] = useState<string | null>(null)

  // ── Crear estilista ────────────────────────────────────
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.telefono.trim()) { toast.error('El teléfono es requerido'); return }

    setSaving(true)
    const email = telefonoToEmail(form.telefono)
    const password = form.telefono.trim()

    const res = await fetch('/api/usuarios/crear-estilista', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: form.nombre, telefono: form.telefono, email, password, salon_id: salonId }),
    })

    const data = await res.json()
    setSaving(false)

    if (!res.ok) { toast.error(data.error ?? 'Error al crear estilista'); return }
    toast.success(`Estilista creado. Usuario: ${email}`)
    setForm({ nombre: '', telefono: '' })
    setShowForm(false)
    router.refresh()
  }

  // ── Restablecer contraseña ─────────────────────────────
  async function resetPassword(estilista: Perfil) {
    setResettingId(estilista.id)
    const res = await fetch('/api/usuarios/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario_id: estilista.id, nueva_password: estilista.telefono }),
    })

    const data = await res.json()
    setResettingId(null)

    if (!res.ok) { toast.error(data.error ?? 'Error'); return }
    toast.success(`Contraseña restablecida a: ${estilista.telefono}`)
  }

  // ── Toggle activo ──────────────────────────────────────
  async function toggleActivo(estilista: Perfil) {
    const { error } = await supabase
      .from('perfiles')
      .update({ activo: !estilista.activo })
      .eq('id', estilista.id)

    if (error) { toast.error('Error al actualizar'); return }
    toast.success(estilista.activo ? 'Estilista desactivado' : 'Estilista activado')
    router.refresh()
  }

  return (
    <div className="space-y-4">

      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancelar' : '+ Nuevo estilista'}
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <form onSubmit={handleCreate} className="card grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="label">Nombre completo *</label>
            <input className="input" required placeholder="Ej. Alejandra López"
              value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
          </div>
          <div>
            <label className="label">Teléfono * (será su contraseña)</label>
            <input className="input" required placeholder="Ej. 3312345678" type="tel"
              value={form.telefono} onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))} />
          </div>
          <div>
            <p className="text-xs mb-2" style={{ color: 'var(--color-warm-500)' }}>
              Usuario: {form.telefono ? telefonoToEmail(form.telefono) : '—'}
            </p>
            <button type="submit" className="btn-primary w-full justify-center" disabled={saving}>
              {saving ? 'Creando…' : 'Crear estilista'}
            </button>
          </div>
        </form>
      )}

      {/* Tabla */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead style={{ background: 'var(--color-warm-100)' }}>
            <tr className="text-left">
              {['Nombre', 'Teléfono / Usuario', 'Registrado', 'Estado', 'Acciones'].map(h => (
                <th key={h} className="px-4 py-3 font-medium text-xs uppercase tracking-wide"
                    style={{ color: 'var(--color-warm-600)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--color-warm-200)' }}>
            {estilistas.map(e => (
              <tr key={e.id} className={cn(!e.activo && 'opacity-50')}>
                <td className="px-4 py-3 font-medium">{e.nombre}</td>
                <td className="px-4 py-3" style={{ color: 'var(--color-warm-500)' }}>
                  <p>{e.telefono}</p>
                  <p className="text-xs">{telefonoToEmail(e.telefono ?? '')}</p>
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--color-warm-500)' }}>
                  {formatFechaCorta(e.created_at)}
                </td>
                <td className="px-4 py-3">
                  <span className={cn('badge', e.activo ? 'bg-green-100 text-green-700' : 'bg-warm-200 text-warm-500')}>
                    {e.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      className="btn-secondary text-xs px-3 py-1.5"
                      onClick={() => resetPassword(e)}
                      disabled={resettingId === e.id}
                    >
                      {resettingId === e.id ? '…' : 'Reset contraseña'}
                    </button>
                    <button
                      className={cn('text-xs px-3 py-1.5 rounded-lg border font-medium transition-all', e.activo
                        ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                        : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                      )}
                      onClick={() => toggleActivo(e)}
                    >
                      {e.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {estilistas.length === 0 && (
          <p className="text-sm text-center py-10" style={{ color: 'var(--color-warm-400)' }}>
            No hay estilistas. Agrega el primero.
          </p>
        )}
      </div>
    </div>
  )
}
