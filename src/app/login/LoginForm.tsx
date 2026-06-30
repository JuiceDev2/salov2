'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { getDashboardByRol } from '@/lib/auth/server'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!email || !password) {
      toast.error('Ingresa email y contraseña')
      return
    }

    setLoading(true)

    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Error de Supabase:', error)
      toast.error(error.message)
      setLoading(false)
      return
    }

    const { data: userData } = await supabase.auth.getUser()

    const res = await fetch('/api/me')
    const perfil = await res.json()

    if (perfil?.rol) {
      router.push(getDashboardByRol(perfil.rol))
    } else {
      router.push('/')
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input
        type="email"
        placeholder="Correo"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 rounded"
      />

      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2 rounded"
      />

      <button
        type="submit"
        disabled={loading}
        className="bg-black text-white p-2 rounded"
      >
        {loading ? 'Entrando...' : 'Iniciar sesión'}
      </button>
    </form>
  )
}