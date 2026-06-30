import { formatPeso } from '@/lib/utils'

interface Props {
  totalClientes: number
  citasHoy: number
  ingresosDia: number
  citasPendientes: number
}

export default function StatsGrid({ totalClientes, citasHoy, ingresosDia, citasPendientes }: Props) {
  const stats = [
    { label: 'Clientes registrados', value: totalClientes.toLocaleString('es-MX'), icon: '👥' },
    { label: 'Citas hoy',            value: citasHoy.toString(),                   icon: '📅' },
    { label: 'Ingresos del día',     value: formatPeso(ingresosDia),               icon: '💵' },
    { label: 'Citas pendientes',     value: citasPendientes.toString(),             icon: '⏳' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map(s => (
        <div key={s.label} className="card">
          <p className="text-2xl mb-2">{s.icon}</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--color-salon-800)' }}>
            {s.value}
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-warm-500)' }}>
            {s.label}
          </p>
        </div>
      ))}
    </div>
  )
}
