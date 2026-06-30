'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/browser'
import type { Turno } from '@/types'

export function useTurno(salonId: string) {
  const [turno, setTurno]     = useState<Turno | null>(null)
  const [loading, setLoading] = useState(true)

  const cargar = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('turnos')
      .select('*')
      .eq('salon_id', salonId)
      .eq('activo', true)
      .single()
    setTurno(data as Turno | null)
    setLoading(false)
  }, [salonId])

  useEffect(() => {
    cargar()

    // Suscripción en tiempo real — actualiza sin refrescar la página
    const supabase = createClient()
    const channel = supabase
      .channel(`turno-${salonId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'turnos', filter: `salon_id=eq.${salonId}` },
        () => cargar()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [salonId, cargar])

  return { turno, loading, turnoActivo: !!turno }
}
