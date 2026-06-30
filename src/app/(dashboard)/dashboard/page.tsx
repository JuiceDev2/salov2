import { requireAuth, getDashboardByRol } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const perfil = await requireAuth()
  redirect(getDashboardByRol(perfil.rol))
}
