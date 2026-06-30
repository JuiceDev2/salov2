import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getDashboardByRol } from '@/lib/auth'
import type { Rol } from '@/types'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: perfil } = await supabase
          .from('perfiles')
          .select('rol')
          .eq('id', user.id)
          .single()

        if (perfil) {
          return NextResponse.redirect(
            new URL(getDashboardByRol(perfil.rol as Rol), origin)
          )
        }
      }
      return NextResponse.redirect(new URL(next, origin))
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth', origin))
}
