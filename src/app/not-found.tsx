import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8"
         style={{ background: 'var(--color-salon-50)' }}>
      <div className="card max-w-sm w-full text-center">
        <p className="text-5xl mb-4">✂</p>
        <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--color-salon-800)' }}>
          Página no encontrada
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--color-warm-500)' }}>
          La página que buscas no existe o fue movida.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/" className="btn-primary">Ir al inicio</Link>
          <Link href="/dashboard" className="btn-secondary">Mi panel</Link>
        </div>
      </div>
    </div>
  )
}
