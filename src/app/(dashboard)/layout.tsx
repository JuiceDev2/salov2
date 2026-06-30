import { requireAuth } from '@/lib/auth'
import Sidebar from '@/components/layout/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const perfil = await requireAuth()

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-warm-200)' }}>
      <Sidebar perfil={perfil} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
