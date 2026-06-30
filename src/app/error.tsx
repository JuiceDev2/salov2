'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // En producción aquí iría Sentry.captureException(error)
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-8"
         style={{ background: 'var(--color-warm-100)' }}>
      <div className="card max-w-md w-full text-center">
        <p className="text-4xl mb-4">⚠</p>
        <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--color-warm-900)' }}>
          Algo salió mal
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--color-warm-500)' }}>
          Ocurrió un error inesperado. Puedes intentar de nuevo.
        </p>
        {error.digest && (
          <p className="text-xs font-mono mb-4 p-2 rounded"
             style={{ background: 'var(--color-warm-200)', color: 'var(--color-warm-600)' }}>
            Ref: {error.digest}
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <button className="btn-primary" onClick={reset}>
            Intentar de nuevo
          </button>
          <a href="/" className="btn-secondary">
            Ir al inicio
          </a>
        </div>
      </div>
    </div>
  )
}
