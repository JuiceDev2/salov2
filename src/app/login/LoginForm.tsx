'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

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

    // 👇 redirección simple (NO server import)
    router.push('/')

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email"
        className="border p-2 w-full"
      />

      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="password"
        className="border p-2 w-full"
      />

      <button disabled={loading} className="bg-black text-white p-2 w-full">
        {loading ? 'Entrando...' : 'Login'}
      </button>
    </form>
  )
}