import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { Salon, Servicio } from '@/types'

export default async function LandingPage() {
  const supabase = await createClient()

  // Cargar el primer salón activo para mostrar info y servicios
  const { data: salon } = await supabase
    .from('salones')
    .select('*')
    .eq('activo', true)
    .limit(1)
    .single() as { data: Salon | null }

  const { data: servicios } = await supabase
    .from('servicios')
    .select('*')
    .eq('activo', true)
    .eq('salon_id', salon?.id ?? '')
    .order('nombre') as { data: Servicio[] | null }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-salon-50)' }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-warm-300">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✂</span>
          <span className="font-semibold text-warm-900" style={{ color: 'var(--color-salon-800)' }}>
            {salon?.nombre ?? 'Alejandra Salón'}
          </span>
        </div>
        <Link href="/login" className="btn-secondary text-sm">
          Iniciar sesión
        </Link>
      </header>

      {/* ── Hero ───────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <p className="text-sm font-medium tracking-widest uppercase mb-4"
           style={{ color: 'var(--color-salon-600)' }}>
          Salón de belleza profesional
        </p>

        <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6"
            style={{ color: 'var(--color-salon-900)' }}>
          {salon?.nombre ?? 'Alejandra Salón'}
        </h1>

        <p className="text-warm-600 text-lg max-w-md mb-10" style={{ color: 'var(--color-warm-600)' }}>
          Agenda tu cita en segundos. Sin registro, sin complicaciones.
        </p>

        <Link
          href="/agendar"
          className="btn-primary text-base px-8 py-4"
          style={{ borderRadius: '12px', fontSize: '1rem' }}
        >
          Agendar mi cita
        </Link>

        {salon?.telefono && (
          <p className="mt-6 text-sm" style={{ color: 'var(--color-warm-500)' }}>
            ¿Prefieres llamar?{' '}
            <a href={`tel:${salon.telefono}`} style={{ color: 'var(--color-salon-600)' }}>
              {salon.telefono}
            </a>
          </p>
        )}
      </main>

      {/* ── Servicios ──────────────────────────────────────── */}
      {servicios && servicios.length > 0 && (
        <section className="px-6 py-16 bg-white border-t border-warm-300">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-10"
                style={{ color: 'var(--color-salon-800)' }}>
              Nuestros servicios
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {servicios.map(s => (
                <div key={s.id} className="card text-center">
                  <p className="font-semibold text-sm mb-1" style={{ color: 'var(--color-warm-800)' }}>
                    {s.nombre}
                  </p>
                  <p className="text-lg font-bold" style={{ color: 'var(--color-salon-700)' }}>
                    ${Number(s.precio).toLocaleString('es-MX')}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-warm-500)' }}>
                    {s.duracion_min} min
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="py-6 text-center text-xs" style={{ color: 'var(--color-warm-500)' }}>
        {salon?.direccion && <p>{salon.direccion}</p>}
        <p className="mt-1">© {new Date().getFullYear()} {salon?.nombre ?? 'Alejandra Salón'}</p>
      </footer>
    </div>
  )
}
