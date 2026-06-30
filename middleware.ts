import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/', '/login', '/agendar', '/api/citas/crear']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // Rutas públicas — siempre pasan
  if (PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith('/api/citas/crear'))) {
    return response
  }

  // Sin sesión → login
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Obtener perfil y validar rol vs ruta
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol, activo')
    .eq('id', user.id)
    .single()

  if (!perfil || !perfil.activo) {
    return NextResponse.redirect(new URL('/login?error=inactivo', request.url))
  }

  const { rol } = perfil

  // Redirigir al dashboard correcto si está en la raíz de /dashboard
  if (pathname === '/dashboard') {
    const dest = rol === 'propietaria' ? '/propietaria'
               : rol === 'admin'       ? '/admin'
               :                         '/estilista'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  // Protección de rutas por rol
  if (pathname.startsWith('/propietaria') && rol !== 'propietaria') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (pathname.startsWith('/admin') && !['propietaria', 'admin'].includes(rol)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (pathname.startsWith('/estilista') && !['propietaria', 'admin', 'estilista'].includes(rol)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
