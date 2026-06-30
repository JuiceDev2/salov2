interface Props {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export default function PageHeader({ title, subtitle, action }: Props) {
  return (
    <div className="flex items-center justify-between px-8 py-6 bg-white border-b"
         style={{ borderColor: 'var(--color-warm-300)' }}>
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-warm-900)' }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm mt-0.5" style={{ color: 'var(--color-warm-500)' }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
