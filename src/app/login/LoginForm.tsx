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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      toast.error('Credenciales incorrectas')
      setLoading(false)
      return
    }

    const { data } = await supabase.auth.getUser()

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
    <form onSubmit={handleSubmit}>
      <input value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} />

      <button disabled={loading}>
        {loading ? 'Entrando...' : 'Login'}
      </button>
    </form>
  )
}