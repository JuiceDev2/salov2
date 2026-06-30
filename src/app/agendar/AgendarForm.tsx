'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import type { Salon, Servicio, Perfil } from '@/types'
import { formatPeso } from '@/lib/utils'

interface Props {
  salones: Salon[]
  serviciosIniciales: Servicio[]
  estilistas: Perfil[]
  salonDefault: Salon | null
}

export default function AgendarForm({ salones, serviciosIniciales, estilistas, salonDefault }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [exito, setExito] = useState(false)

  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    salon_id: salonDefault?.id ?? '',
    servicio_id: '',
    estilista_id: estilistas[0]?.id ?? '',
    fecha: '',
    hora: '',
    notas: '',
  })

  const servicioSeleccionado = serviciosIniciales.find(s => s.id === form.servicio_id)

  // Mínimo: mañana
  const hoy = new Date()
  hoy.setDate(hoy.getDate() + 1)
  const minFecha = hoy.toISOString().split('T')[0]

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.servicio_id) { toast.error('Selecciona un servicio'); return }
    if (!form.fecha || !form.hora) { toast.error('Selecciona fecha y hora'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/citas/crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_cliente: form.nombre,
          telefono_cliente: form.telefono,
          salon_id: form.salon_id,
          servicio_id: form.servicio_id,
          estilista_id: form.estilista_id || null,
          fecha_hora: `${form.fecha}T${form.hora}:00`,
          notas: form.notas || null,
          origen: 'internet',
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al agendar')

      setExito(true)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  if (exito) {
    return (
      <div className="card text-center py-12">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-salon-800)' }}>
          ¡Cita agendada!
        </h2>
        <p className="mb-1" style={{ color: 'var(--color-warm-600)' }}>
          Te esperamos el <strong>{form.fecha}</strong> a las <strong>{form.hora}</strong>
        </p>
        <p className="text-sm mb-6" style={{ color: 'var(--color-warm-500)' }}>
          Si necesitas cancelar, llámanos directamente.
        </p>
        <button className="btn-secondary" onClick={() => router.push('/')}>
          Volver al inicio
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Nombre */}
      <div>
        <label className="label">Nombre completo *</label>
        <input
          className="input"
          placeholder="Ej. María González"
          value={form.nombre}
          onChange={e => set('nombre', e.target.value)}
          required
        />
      </div>

      {/* Teléfono */}
      <div>
        <label className="label">Teléfono *</label>
        <input
          className="input"
          type="tel"
          placeholder="Ej. 3312345678"
          value={form.telefono}
          onChange={e => set('telefono', e.target.value)}
          required
        />
      </div>

      {/* Servicio */}
      <div>
        <label className="label">Servicio *</label>
        <select
          className="input"
          value={form.servicio_id}
          onChange={e => set('servicio_id', e.target.value)}
          required
        >
          <option value="">Selecciona un servicio…</option>
          {serviciosIniciales.map(s => (
            <option key={s.id} value={s.id}>
              {s.nombre} — {formatPeso(s.precio)} ({s.duracion_min} min)
            </option>
          ))}
        </select>
      </div>

      {/* Estilista (si hay más de uno) */}
      {estilistas.length > 1 && (
        <div>
          <label className="label">Estilista</label>
          <select
            className="input"
            value={form.estilista_id}
            onChange={e => set('estilista_id', e.target.value)}
          >
            <option value="">Sin preferencia</option>
            {estilistas.map(e => (
              <option key={e.id} value={e.id}>{e.nombre}</option>
            ))}
          </select>
        </div>
      )}

      {/* Fecha y hora */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Fecha *</label>
          <input
            className="input"
            type="date"
            min={minFecha}
            value={form.fecha}
            onChange={e => set('fecha', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Hora *</label>
          <input
            className="input"
            type="time"
            min="09:00"
            max="19:00"
            value={form.hora}
            onChange={e => set('hora', e.target.value)}
            required
          />
        </div>
      </div>

      {/* Notas opcionales */}
      <div>
        <label className="label">Notas (opcional)</label>
        <textarea
          className="input"
          rows={3}
          placeholder="¿Algo que debamos saber?"
          value={form.notas}
          onChange={e => set('notas', e.target.value)}
          style={{ resize: 'none' }}
        />
      </div>

      {/* Resumen */}
      {servicioSeleccionado && (
        <div className="rounded-lg p-4" style={{ background: 'var(--color-salon-50)', border: '1px solid var(--color-salon-200)' }}>
          <p className="text-sm font-medium" style={{ color: 'var(--color-salon-700)' }}>
            Resumen: {servicioSeleccionado.nombre} — {formatPeso(servicioSeleccionado.precio)}
          </p>
        </div>
      )}

      <button type="submit" className="btn-primary w-full justify-center py-3" disabled={loading}>
        {loading ? 'Agendando…' : 'Confirmar cita'}
      </button>
    </form>
  )
}
