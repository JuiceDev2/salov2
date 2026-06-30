import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'

type Cookie = {
  name: string
  value: string
  options?: CookieOptions
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet: Cookie[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = req.nextUrl.pathname

  const isLogin = path === '/login'

  // ❌ si NO está logueado → solo puede entrar a login
  if (!user && !isLogin) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // ❌ si está logueado y entra a login → mandarlo a su dashboard
  if (user && isLogin) {
    const { data: perfil, error } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    const rol = perfil?.rol

    let redirectTo = '/'

    if (rol === 'admin') redirectTo = '/admin'
    if (rol === 'propietaria') redirectTo = '/propietaria'
    if (rol === 'estilista') redirectTo = '/estilista'

    return NextResponse.redirect(new URL(redirectTo, req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}