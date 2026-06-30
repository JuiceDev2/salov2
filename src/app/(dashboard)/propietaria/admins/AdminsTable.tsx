'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import toast from 'react-hot-toast'
import type { Perfil, Salon } from '@/types'
import { formatFechaCorta, cn } from '@/lib/utils'

type AdminConSalon = Perfil & { salon: { nombre: string } | null }

interface Props {
  admins: AdminConSalon[]
  salones: Pick<Salon, 'id' | 'nombre'>[]
}

export default function AdminsTable({ admins, salones }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '', salon_id: salones[0]?.id ?? '' })
  const [saving, setSaving] = useState(false)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [resettingId, setResettingId] = useState<string | null>(null)

  async function crearAdmin(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const res = await fetch('/api/usuarios/crear-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSaving(false)

    if (!res.ok) { toast.error(data.error ?? 'Error al crear admin'); return }

    setTempPassword(data.temp_password)
    setForm({ nombre: '', email: '', telefono: '', salon_id: salones[0]?.id ?? '' })
    setShowForm(false)
    router.refresh()
  }

  async function toggleActivo(admin: Perfil) {
    const { error } = await supabase
      .from('perfiles')
      .update({ activo: !admin.activo })
      .eq('id', admin.id)

    if (error) { toast.error('Error'); return }
    toast.success(admin.activo ? 'Admin desactivado' : 'Admin activado')
    router.refresh()
  }

  async function resetPassword(admin: Perfil) {
    setResettingId(admin.id)
    const nuevaPassword = Math.random().toString(36).slice(-8)

    const res = await fetch('/api/usuarios/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario_id: admin.id, nueva_password: nuevaPassword }),
    })

    setResettingId(null)
    if (!res.ok) { toast.error('Error al resetear'); return }
    setTempPassword(nuevaPassword)
    toast.success('Contraseña restablecida')
  }

  return (
    <div className="space-y-4">

      {/* Contraseña temporal generada */}
      {tempPassword && (
        <div className="rounded-lg p-4 flex items-center justify-between"
             style={{ background: '#fefce8', border: '1px solid #fde68a' }}>
          <div>
            <p className="text-sm font-medium" style={{ color: '#92400e' }}>
              ⚠ Contraseña temporal generada — anótala antes de cerrar esta pantalla
            </p>
            <p className="font-mono font-bold text-lg mt-1" style={{ color: '#78350f' }}>
              {tempPassword}
            </p>
          </div>
          <button className="btn-ghost text-xs" onClick={() => setTempPassword(null)}>✕</button>
        </div>
      )}

      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancelar' : '+ Nuevo admin'}
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <form onSubmit={crearAdmin} className="card grid grid-cols-2 gap-4 items-end">
          <div>
            <label className="label">Nombre *</label>
            <input className="input" required value={form.nombre}
              onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
          </div>
          <div>
            <label className="label">Email *</label>
            <input className="input" type="email" required value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
          </div>
          <div>
            <label className="label">Teléfono</label>
            <input className="input" type="tel" value={form.telefono}
              onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))} />
          </div>
          <div>
            <label className="label">Salón *</label>
            <select className="input" required value={form.salon_id}
              onChange={e => setForm(p => ({ ...p, salon_id: e.target.value }))}>
              {salones.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
          <div className="col-span-2 flex justify-end">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Creando…' : 'Crear admin'}
            </button>
          </div>
        </form>
      )}

      {/* Tabla */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead style={{ background: 'var(--color-warm-100)' }}>
            <tr className="text-left">
              {['Nombre', 'Email', 'Salón', 'Registrado', 'Estado', 'Acciones'].map(h => (
                <th key={h} className="px-4 py-3 text-xs font-medium uppercase tracking-wide"
                    style={{ color: 'var(--color-warm-600)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--color-warm-200)' }}>
            {admins.map(a => (
              <tr key={a.id} className={cn(!a.activo && 'opacity-50')}>
                <td className="px-4 py-3 font-medium">{a.nombre}</td>
                <td className="px-4 py-3" style={{ color: 'var(--color-warm-500)' }}>{a.email}</td>
                <td className="px-4 py-3" style={{ color: 'var(--color-warm-500)' }}>
                  {a.salon?.nombre ?? '—'}
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-warm-500)' }}>
                  {formatFechaCorta(a.created_at)}
                </td>
                <td className="px-4 py-3">
                  <span className={cn('badge', a.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600')}>
                    {a.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      className="btn-secondary text-xs px-3 py-1.5"
                      onClick={() => resetPassword(a)}
                      disabled={resettingId === a.id}
                    >
                      {resettingId === a.id ? '…' : 'Reset pwd'}
                    </button>
                    <button
                      className={cn('text-xs px-3 py-1.5 rounded-lg border font-medium', a.activo
                        ? 'bg-red-50 text-red-600 border-red-200'
                        : 'bg-green-50 text-green-700 border-green-200')}
                      onClick={() => toggleActivo(a)}
                    >
                      {a.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {admins.length === 0 && (
          <p className="text-sm text-center py-10" style={{ color: 'var(--color-warm-400)' }}>
            Sin administradores. Crea el primero.
          </p>
        )}
      </div>
    </div>
  )
}
