export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between px-8 py-6 bg-white border-b"
           style={{ borderColor: 'var(--color-warm-300)' }}>
        <div className="space-y-2">
          <div className="h-5 w-40 rounded" style={{ background: 'var(--color-warm-200)' }} />
          <div className="h-3 w-24 rounded" style={{ background: 'var(--color-warm-200)' }} />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="p-8 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card space-y-3">
              <div className="h-6 w-6 rounded" style={{ background: 'var(--color-warm-200)' }} />
              <div className="h-7 w-24 rounded" style={{ background: 'var(--color-warm-200)' }} />
              <div className="h-3 w-32 rounded" style={{ background: 'var(--color-warm-200)' }} />
            </div>
          ))}
        </div>

        {/* Table skeleton */}
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3" style={{ background: 'var(--color-warm-100)' }}>
            <div className="h-3 w-48 rounded" style={{ background: 'var(--color-warm-300)' }} />
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-6 px-4 py-4 border-t"
                 style={{ borderColor: 'var(--color-warm-200)' }}>
              <div className="h-4 w-32 rounded" style={{ background: 'var(--color-warm-200)' }} />
              <div className="h-4 w-24 rounded" style={{ background: 'var(--color-warm-200)' }} />
              <div className="h-4 w-20 rounded" style={{ background: 'var(--color-warm-200)' }} />
              <div className="h-4 w-16 rounded ml-auto" style={{ background: 'var(--color-warm-200)' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
