'use client'

import type { Salon } from '@/types'
import { formatPeso } from '@/lib/utils'

interface Cobro { salon_id: string; monto: number; fecha: string }
interface Cita   { salon_id: string; estado: string; fecha_hora: string; origen: string }

interface Props {
  salones: Salon[]
  cobros: Cobro[]
  citas: Cita[]
}

export default function ReportesView({ salones, cobros, citas }: Props) {
  const salonNombre = (id: string) => salones.find(s => s.id === id)?.nombre ?? id

  // ── Ingresos por salón ────────────────────────────────────
  const ingresosPorSalon = salones.map(salon => {
    const total = cobros
      .filter(c => c.salon_id === salon.id)
      .reduce((s, c) => s + Number(c.monto), 0)
    return { salon, total }
  }).sort((a, b) => b.total - a.total)

  const ingresosTotal = ingresosPorSalon.reduce((s, r) => s + r.total, 0)
  const maxIngreso    = Math.max(...ingresosPorSalon.map(r => r.total), 1)

  // ── Citas por estado ──────────────────────────────────────
  const estadoCounts = citas.reduce<Record<string, number>>((acc, c) => {
    acc[c.estado] = (acc[c.estado] ?? 0) + 1
    return acc
  }, {})

  // ── Citas por origen ──────────────────────────────────────
  const origenInternet = citas.filter(c => c.origen === 'internet').length
  const origenLocal    = citas.filter(c => c.origen === 'local').length

  // ── Ingresos últimos 7 días (todos los salones) ───────────
  const hoy = new Date()
  const dias7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(hoy)
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })

  const ingresosPorDia = dias7.map(dia => ({
    dia: dia.slice(5), // MM-DD
    total: cobros
      .filter(c => c.fecha.startsWith(dia))
      .reduce((s, c) => s + Number(c.monto), 0),
  }))

  const maxDia = Math.max(...ingresosPorDia.map(d => d.total), 1)

  const ESTADO_COLORS_REPORTE: Record<string, string> = {
    confirmada:  '#3b82f6',
    en_curso:    '#f59e0b',
    completada:  '#16a34a',
    cancelada:   '#ef4444',
  }

  return (
    <div className="space-y-8">

      {/* ── Resumen global ──────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Ingresos totales (30d)', value: formatPeso(ingresosTotal),           icon: '💵' },
          { label: 'Total citas (30d)',       value: citas.length.toString(),             icon: '📅' },
          { label: 'Citas internet',          value: origenInternet.toString(),           icon: '🌐' },
          { label: 'Citas en local',          value: origenLocal.toString(),              icon: '🏪' },
        ].map(s => (
          <div key={s.label} className="card">
            <p className="text-2xl mb-2">{s.icon}</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--color-salon-800)' }}>{s.value}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-warm-500)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Gráfica: Ingresos últimos 7 días ───────────────── */}
      <div className="card">
        <h2 className="font-semibold mb-6" style={{ color: 'var(--color-warm-800)' }}>
          Ingresos últimos 7 días
        </h2>
        <div className="flex items-end gap-3 h-48">
          {ingresosPorDia.map(d => (
            <div key={d.dia} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs font-medium" style={{ color: 'var(--color-salon-700)' }}>
                {d.total > 0 ? formatPeso(d.total) : ''}
              </span>
              <div
                className="w-full rounded-t-lg transition-all"
                style={{
                  height:     `${Math.max((d.total / maxDia) * 160, d.total > 0 ? 8 : 2)}px`,
                  background: d.total > 0 ? 'var(--color-salon-600)' : 'var(--color-warm-300)',
                }}
              />
              <span className="text-xs" style={{ color: 'var(--color-warm-500)' }}>{d.dia}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ── Ingresos por salón ────────────────────────────── */}
        <div className="card">
          <h2 className="font-semibold mb-6" style={{ color: 'var(--color-warm-800)' }}>
            Ingresos por salón (30d)
          </h2>
          <div className="space-y-4">
            {ingresosPorSalon.map(({ salon, total }) => (
              <div key={salon.id}>
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm font-medium">{salon.nombre}</span>
                  <span className="text-sm font-bold" style={{ color: 'var(--color-salon-700)' }}>
                    {formatPeso(total)}
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-warm-200)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width:      `${(total / maxIngreso) * 100}%`,
                      background: 'var(--color-salon-600)',
                    }}
                  />
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--color-warm-500)' }}>
                  {ingresosTotal > 0
                    ? `${((total / ingresosTotal) * 100).toFixed(1)}% del total`
                    : '0%'
                  }
                </p>
              </div>
            ))}
            {ingresosPorSalon.length === 0 && (
              <p className="text-sm text-center py-4" style={{ color: 'var(--color-warm-400)' }}>
                Sin datos
              </p>
            )}
          </div>
        </div>

        {/* ── Citas por estado ──────────────────────────────── */}
        <div className="card">
          <h2 className="font-semibold mb-6" style={{ color: 'var(--color-warm-800)' }}>
            Citas por estado (30d)
          </h2>
          <div className="space-y-3">
            {Object.entries(estadoCounts).map(([estado, count]) => {
              const pct = citas.length > 0 ? ((count / citas.length) * 100).toFixed(1) : '0'
              return (
                <div key={estado}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-sm font-medium capitalize">{estado.replace('_', ' ')}</span>
                    <span className="text-sm font-bold">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-warm-200)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width:      `${pct}%`,
                        background: ESTADO_COLORS_REPORTE[estado] ?? '#6b7280',
                      }}
                    />
                  </div>
                </div>
              )
            })}
            {Object.keys(estadoCounts).length === 0 && (
              <p className="text-sm text-center py-4" style={{ color: 'var(--color-warm-400)' }}>
                Sin datos
              </p>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
