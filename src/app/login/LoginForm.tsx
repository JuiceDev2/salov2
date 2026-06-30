'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { getDashboardByRol } from '@/lib/auth'
import type { Rol } from '@/types'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error('Credenciales incorrectas')
      setLoading(false)
      return
    }

    // Obtener rol para redirigir al dashboard correcto
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol, activo')
      .eq('id', data.user.id)
      .single()

    if (!perfil?.activo) {
      await supabase.auth.signOut()
      toast.error('Tu cuenta está desactivada. Contacta al administrador.')
      setLoading(false)
      return
    }

    router.push(getDashboardByRol(perfil.rol as Rol))
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Correo / Usuario</label>
        <input
          className="input"
          type="email"
          placeholder="correo@ejemplo.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete="username"
        />
      </div>

      <div>
        <label className="label">Contraseña</label>
        <input
          className="input"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>

      <button
        type="submit"
        className="btn-primary w-full justify-center py-3"
        disabled={loading}
      >
        {loading ? 'Entrando…' : 'Entrar'}
      </button>

      <p className="text-xs text-center mt-4" style={{ color: 'var(--color-warm-500)' }}>
        ¿Olvidaste tu contraseña? Contacta a tu administrador.
      </p>
    </form>
  )
}
