'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/browser'
import type { Perfil } from '@/types'

export function useAuth() {
  const [perfil, setPerfil]   = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function cargarPerfil(userId: string) {
      const { data } = await supabase
        .from('perfiles')
        .select('*, salon:salones(*)')
        .eq('id', userId)
        .single()
      setPerfil(data as Perfil | null)
    }

    // Sesión inicial
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) cargarPerfil(user.id).finally(() => setLoading(false))
      else { setPerfil(null); setLoading(false) }
    })

    // Escuchar cambios de sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) cargarPerfil(session.user.id)
      else setPerfil(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { perfil, loading, isAdmin: perfil?.rol === 'admin', isPropietaria: perfil?.rol === 'propietaria', isEstilista: perfil?.rol === 'estilista' }
}
