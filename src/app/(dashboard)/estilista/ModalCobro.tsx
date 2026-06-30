'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/browser'
import toast from 'react-hot-toast'
import type { Cita } from '@/types'
import { formatPeso } from '@/lib/utils'

interface Props {
  cita: Cita
  estilistaId: string
  salonId: string
  onClose: () => void
  onSuccess: () => void
}

export default function ModalCobro({ cita, estilistaId, salonId, onClose, onSuccess }: Props) {
  const supabase = createClient()
  const precioBase = cita.servicio?.precio ?? 0
  const [monto, setMonto] = useState(precioBase.toString())
  const [notas, setNotas] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleCobrar(e: React.FormEvent) {
    e.preventDefault()
    const montoNum = parseFloat(monto)
    if (isNaN(montoNum) || montoNum <= 0) { toast.error('Monto inválido'); return }

    setSaving(true)

    // Registrar cobro
    const { error: errCobro } = await supabase.from('cobros').insert({
      salon_id:    salonId,
      cita_id:     cita.id,
      estilista_id: estilistaId,
      cliente_id:  cita.cliente_id,
      servicio_id: cita.servicio_id,
      monto:       montoNum,
      metodo_pago: 'efectivo',
      notas:       notas || null,
      fecha:       new Date().toISOString(),
    })

    if (errCobro) { toast.error('Error al registrar cobro'); setSaving(false); return }

    // Audit log
    await supabase.rpc('log_actividad', {
      p_salon_id:   salonId,
      p_accion:     'cobro_registrado',
      p_entidad:    'cobros',
      p_entidad_id: cita.id,
      p_detalle: {
        cliente:  cita.cliente?.nombre,
        servicio: cita.servicio?.nombre,
        monto:    montoNum,
      },
    })

    toast.success(`Cobro registrado: ${formatPeso(montoNum)}`)
    setSaving(false)
    onSuccess()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="card w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-warm-900)' }}>
            Registrar cobro
          </h2>
          <button className="btn-ghost px-2 py-1" onClick={onClose}>✕</button>
        </div>

        {/* Resumen de la cita */}
        <div className="rounded-lg p-4 mb-6"
             style={{ background: 'var(--color-salon-50)', border: '1px solid var(--color-salon-200)' }}>
          <p className="font-semibold">{cita.cliente?.nombre}</p>
          <p className="text-sm" style={{ color: 'var(--color-warm-600)' }}>
            {cita.servicio?.nombre}
          </p>
          <p className="text-lg font-bold mt-1" style={{ color: 'var(--color-salon-700)' }}>
            Precio base: {formatPeso(precioBase)}
          </p>
        </div>

        <form onSubmit={handleCobrar} className="space-y-4">
          <div>
            <label className="label">Monto a cobrar (MXN) *</label>
            <input
              className="input text-xl font-bold"
              type="number"
              min={0}
              step="0.01"
              value={monto}
              onChange={e => setMonto(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="label">Notas (opcional)</label>
            <input
              className="input"
              placeholder="Ej. descuento, propina…"
              value={notas}
              onChange={e => setNotas(e.target.value)}
            />
          </div>

          <div className="rounded-lg p-3 text-sm font-medium text-center"
               style={{ background: '#f0fdf4', color: '#15803d' }}>
            Método de pago: 💵 Efectivo
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1 justify-center" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={saving}>
              {saving ? 'Registrando…' : `Cobrar ${formatPeso(parseFloat(monto) || 0)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
