import LoginForm from './LoginForm'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Iniciar sesión' }

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4"
         style={{ background: 'var(--color-salon-50)' }}>

      <Link href="/" className="mb-8 flex items-center gap-2 text-sm"
            style={{ color: 'var(--color-warm-500)' }}>
        ← Volver al inicio
      </Link>

      <div className="card w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-3xl">✂</span>
          <h1 className="text-xl font-bold mt-2" style={{ color: 'var(--color-salon-800)' }}>
            Acceso al sistema
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-warm-500)' }}>
            Para administradores y estilistas
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  )
}
