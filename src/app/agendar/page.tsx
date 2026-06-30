import { createClient } from '@/lib/supabase/server'
import AgendarForm from './AgendarForm'
import type { Salon, Servicio, Perfil } from '@/types'
import Link from 'next/link'

export const metadata = { title: 'Agendar cita' }

export default async function AgendarPage() {
  const supabase = await createClient()

  const { data: salones } = await supabase
    .from('salones')
    .select('*')
    .eq('activo', true)
    .order('nombre') as { data: Salon[] | null }

  // Servicios del primer salón activo por default
  const salonDefault = salones?.[0]

  const { data: servicios } = await supabase
    .from('servicios')
    .select('*')
    .eq('activo', true)
    .eq('salon_id', salonDefault?.id ?? '')
    .order('nombre') as { data: Servicio[] | null }

  const { data: estilistas } = await supabase
    .from('perfiles')
    .select('*')
    .eq('rol', 'estilista')
    .eq('activo', true)
    .eq('salon_id', salonDefault?.id ?? '') as { data: Perfil[] | null }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-salon-50)' }}>
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-warm-300">
        <Link href="/" className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-salon-700)' }}>
          ← Volver
        </Link>
        <span className="font-semibold" style={{ color: 'var(--color-salon-800)' }}>
          {salonDefault?.nombre ?? 'Agendar cita'}
        </span>
        <div className="w-16" />
      </header>

      <main className="max-w-lg mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-salon-900)' }}>
          Agenda tu cita
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--color-warm-600)' }}>
          Sin registro. Solo tu nombre, teléfono y el servicio que deseas.
        </p>

        <AgendarForm
          salones={salones ?? []}
          serviciosIniciales={servicios ?? []}
          estilistas={estilistas ?? []}
          salonDefault={salonDefault ?? null}
        />
      </main>
    </div>
  )
}
