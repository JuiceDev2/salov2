'use client'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="card max-w-md w-full text-center">
        <p className="text-3xl mb-3">⚠</p>
        <h2 className="font-bold mb-2">Error al cargar la página</h2>
        <p className="text-sm mb-5" style={{ color: 'var(--color-warm-500)' }}>
          {error.message || 'Ocurrió un error inesperado'}
        </p>
        <button className="btn-primary" onClick={reset}>
          Reintentar
        </button>
      </div>
    </div>
  )
}
