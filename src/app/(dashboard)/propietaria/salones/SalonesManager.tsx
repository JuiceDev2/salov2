'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import toast from 'react-hot-toast'
import type { Salon, Perfil } from '@/types'
import { cn } from '@/lib/utils'

interface Props { salones: Salon[]; admins: Perfil[] }

export default function SalonesManager({ salones, admins }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [showSalon, setShowSalon] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [salonForm, setSalonForm] = useState({ nombre: '', direccion: '', telefono: '' })
  const [adminForm, setAdminForm] = useState({ nombre: '', email: '', telefono: '', salon_id: salones[0]?.id ?? '' })
  const [saving, setSaving] = useState(false)

  async function crearSalon(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { error } = await supabase.from('salones').insert({
      nombre: salonForm.nombre, direccion: salonForm.direccion || null, telefono: salonForm.telefono || null,
    })
    setSaving(false)
    if (error) { toast.error('Error al crear salón'); return }
    toast.success('Salón creado')
    setSalonForm({ nombre: '', direccion: '', telefono: '' })
    setShowSalon(false)
    router.refresh()
  }

  async function toggleSalon(salon: Salon) {
    const { error } = await supabase.from('salones').update({ activo: !salon.activo }).eq('id', salon.id)
    if (error) { toast.error('Error'); return }
    toast.success(salon.activo ? 'Salón desactivado' : 'Salón activado')
    router.refresh()
  }

  async function crearAdmin(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/usuarios/crear-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adminForm),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { toast.error(data.error ?? 'Error'); return }
    toast.success('Admin creado')
    setAdminForm({ nombre: '', email: '', telefono: '', salon_id: salones[0]?.id ?? '' })
    setShowAdmin(false)
    router.refresh()
  }

  return (
    <div className="space-y-8">

      {/* Salones */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Salones ({salones.length})</h2>
          <button className="btn-primary" onClick={() => setShowSalon(!showSalon)}>
            {showSalon ? '✕ Cancelar' : '+ Nuevo salón'}
          </button>
        </div>

        {showSalon && (
          <form onSubmit={crearSalon} className="card grid grid-cols-3 gap-4 items-end mb-4">
            <div>
              <label className="label">Nombre *</label>
              <input className="input" required placeholder="Ej. Sucursal Norte"
                value={salonForm.nombre} onChange={e => setSalonForm(p => ({ ...p, nombre: e.target.value }))} />
            </div>
            <div>
              <label className="label">Dirección</label>
              <input className="input" placeholder="Ej. Av. López 45"
                value={salonForm.direccion} onChange={e => setSalonForm(p => ({ ...p, direccion: e.target.value }))} />
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input className="input" type="tel"
                value={salonForm.telefono} onChange={e => setSalonForm(p => ({ ...p, telefono: e.target.value }))} />
            </div>
            <div className="col-span-3 flex justify-end">
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Creando…' : 'Crear salón'}</button>
            </div>
          </form>
        )}

        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead style={{ background: 'var(--color-warm-100)' }}>
              <tr>{['Nombre', 'Dirección', 'Teléfono', 'Estado', 'Acción'].map(h => (
                <th key={h} className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-left"
                    style={{ color: 'var(--color-warm-600)' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--color-warm-200)' }}>
              {salones.map(s => (
                <tr key={s.id} className={cn(!s.activo && 'opacity-50')}>
                  <td className="px-4 py-3 font-medium">{s.nombre}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-warm-500)' }}>{s.direccion ?? '—'}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-warm-500)' }}>{s.telefono ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${s.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {s.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      className={cn('text-xs px-3 py-1.5 rounded-lg border font-medium', s.activo
                        ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-700 border-green-200')}
                      onClick={() => toggleSalon(s)}
                    >
                      {s.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admins */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Administradores ({admins.length})</h2>
          <button className="btn-primary" onClick={() => setShowAdmin(!showAdmin)}>
            {showAdmin ? '✕ Cancelar' : '+ Nuevo admin'}
          </button>
        </div>

        {showAdmin && (
          <form onSubmit={crearAdmin} className="card grid grid-cols-2 gap-4 items-end mb-4">
            <div>
              <label className="label">Nombre *</label>
              <input className="input" required value={adminForm.nombre}
                onChange={e => setAdminForm(p => ({ ...p, nombre: e.target.value }))} />
            </div>
            <div>
              <label className="label">Email *</label>
              <input className="input" type="email" required value={adminForm.email}
                onChange={e => setAdminForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input className="input" type="tel" value={adminForm.telefono}
                onChange={e => setAdminForm(p => ({ ...p, telefono: e.target.value }))} />
            </div>
            <div>
              <label className="label">Salón asignado *</label>
              <select className="input" required value={adminForm.salon_id}
                onChange={e => setAdminForm(p => ({ ...p, salon_id: e.target.value }))}>
                {salones.filter(s => s.activo).map(s => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 flex justify-end">
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Creando…' : 'Crear admin'}</button>
            </div>
          </form>
        )}

        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead style={{ background: 'var(--color-warm-100)' }}>
              <tr>{['Nombre', 'Email', 'Teléfono', 'Salón', 'Estado'].map(h => (
                <th key={h} className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-left"
                    style={{ color: 'var(--color-warm-600)' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--color-warm-200)' }}>
              {admins.map(a => (
                <tr key={a.id} className={cn(!a.activo && 'opacity-50')}>
                  <td className="px-4 py-3 font-medium">{a.nombre}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-warm-500)' }}>{a.email}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-warm-500)' }}>{a.telefono ?? '—'}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-warm-500)' }}>
                    {salones.find(s => s.id === a.salon_id)?.nombre ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${a.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {a.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
