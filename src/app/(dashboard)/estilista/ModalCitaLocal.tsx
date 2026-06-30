'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/browser'
import toast from 'react-hot-toast'
import type { Servicio } from '@/types'
import { formatPeso } from '@/lib/utils'

interface Props {
  estilistaId: string
  salonId: string
  onClose: () => void
  onSuccess: () => void
}

export default function ModalCitaLocal({ estilistaId, salonId, onClose, onSuccess }: Props) {
  const supabase = createClient()
  const [servicios, setServicios] = useState<Servicio[]>([])
  const [form, setForm] = useState({ nombre: '', telefono: '', servicio_id: '', notas: '' })
  const [monto, setMonto] = useState('')
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState<'datos' | 'cobro'>('datos')
  const [citaId, setCitaId] = useState<string | null>(null)
  const [clienteId, setClienteId] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('servicios')
      .select('*')
      .eq('salon_id', salonId)
      .eq('activo', true)
      .order('nombre')
      .then(({ data }) => {
        if (data) setServicios(data as Servicio[])
      })
  }, [])

  const servicioSeleccionado = servicios.find(s => s.id === form.servicio_id)

  useEffect(() => {
    if (servicioSeleccionado) setMonto(servicioSeleccionado.precio.toString())
  }, [form.servicio_id])

  // Paso 1: crear cliente + cita local ya completada
  async function handleCrearCita(e: React.FormEvent) {
    e.preventDefault()
    if (!form.servicio_id) { toast.error('Selecciona un servicio'); return }
    setSaving(true)

    // Buscar o crear cliente
    let cId: string
    const { data: existe } = await supabase
      .from('clientes')
      .select('id')
      .eq('salon_id', salonId)
      .eq('telefono', form.telefono.trim())
      .single()

    if (existe) {
      cId = existe.id
    } else {
      const { data: nuevo, error } = await supabase
        .from('clientes')
        .insert({ salon_id: salonId, nombre: form.nombre.trim(), telefono: form.telefono.trim() })
        .select('id')
        .single()
      if (error || !nuevo) { toast.error('Error al registrar cliente'); setSaving(false); return }
      cId = nuevo.id
    }

    // Crear cita local directamente como completada
    const { data: cita, error: errCita } = await supabase
      .from('citas')
      .insert({
        salon_id:     salonId,
        cliente_id:   cId,
        estilista_id: estilistaId,
        servicio_id:  form.servicio_id,
        fecha_hora:   new Date().toISOString(),
        duracion_min: servicioSeleccionado?.duracion_min ?? 60,
        origen:       'local',
        estado:       'completada',
        notas:        form.notas || null,
      })
      .select('id')
      .single()

    if (errCita || !cita) { toast.error('Error al crear servicio'); setSaving(false); return }

    // Log
    await supabase.rpc('log_actividad', {
      p_salon_id: salonId, p_accion: 'cita_creada_local',
      p_entidad: 'citas', p_entidad_id: cita.id,
      p_detalle: { cliente: form.nombre, servicio: servicioSeleccionado?.nombre },
    })

    setCitaId(cita.id)
    setClienteId(cId)
    setSaving(false)
    setStep('cobro')
  }

  // Paso 2: cobrar
  async function handleCobrar(e: React.FormEvent) {
    e.preventDefault()
    const montoNum = parseFloat(monto)
    if (isNaN(montoNum) || montoNum <= 0) { toast.error('Monto inválido'); return }
    setSaving(true)

    const { error } = await supabase.from('cobros').insert({
      salon_id:     salonId,
      cita_id:      citaId,
      estilista_id: estilistaId,
      cliente_id:   clienteId,
      servicio_id:  form.servicio_id,
      monto:        montoNum,
      metodo_pago:  'efectivo',
      fecha:        new Date().toISOString(),
    })

    if (error) { toast.error('Error al registrar cobro'); setSaving(false); return }

    await supabase.rpc('log_actividad', {
      p_salon_id: salonId, p_accion: 'cobro_registrado',
      p_entidad: 'cobros', p_entidad_id: citaId ?? undefined,
      p_detalle: { monto: montoNum, servicio: servicioSeleccionado?.nombre },
    })

    toast.success(`¡Listo! Cobrado ${formatPeso(montoNum)}`)
    setSaving(false)
    onSuccess()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="card w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold">Servicio en local</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-warm-500)' }}>
              {step === 'datos' ? 'Paso 1 de 2 — datos del cliente' : 'Paso 2 de 2 — cobrar'}
            </p>
          </div>
          <button className="btn-ghost px-2 py-1" onClick={onClose}>✕</button>
        </div>

        {/* Paso 1: datos */}
        {step === 'datos' && (
          <form onSubmit={handleCrearCita} className="space-y-4">
            <div>
              <label className="label">Nombre del cliente *</label>
              <input className="input" required placeholder="Nombre completo"
                value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} />
            </div>
            <div>
              <label className="label">Teléfono *</label>
              <input className="input" required type="tel" placeholder="3312345678"
                value={form.telefono} onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))} />
            </div>
            <div>
              <label className="label">Servicio *</label>
              <select className="input" required value={form.servicio_id}
                onChange={e => setForm(p => ({ ...p, servicio_id: e.target.value }))}>
                <option value="">Selecciona…</option>
                {servicios.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} — {formatPeso(s.precio)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Notas (opcional)</label>
              <input className="input" placeholder="Observaciones"
                value={form.notas} onChange={e => setForm(p => ({ ...p, notas: e.target.value }))} />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" className="btn-secondary flex-1 justify-center" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary flex-1 justify-center" disabled={saving}>
                {saving ? 'Registrando…' : 'Continuar →'}
              </button>
            </div>
          </form>
        )}

        {/* Paso 2: cobro */}
        {step === 'cobro' && (
          <form onSubmit={handleCobrar} className="space-y-4">
            <div className="rounded-lg p-4"
                 style={{ background: 'var(--color-salon-50)', border: '1px solid var(--color-salon-200)' }}>
              <p className="font-semibold">{form.nombre}</p>
              <p className="text-sm" style={{ color: 'var(--color-warm-500)' }}>{servicioSeleccionado?.nombre}</p>
            </div>
            <div>
              <label className="label">Monto a cobrar (MXN) *</label>
              <input className="input text-xl font-bold" type="number" min={0} step="0.01" required
                value={monto} onChange={e => setMonto(e.target.value)} autoFocus />
            </div>
            <div className="rounded-lg p-3 text-sm font-medium text-center"
                 style={{ background: '#f0fdf4', color: '#15803d' }}>
              💵 Efectivo
            </div>
            <button type="submit" className="btn-primary w-full justify-center py-3" disabled={saving}>
              {saving ? 'Registrando…' : `Cobrar ${formatPeso(parseFloat(monto) || 0)}`}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
