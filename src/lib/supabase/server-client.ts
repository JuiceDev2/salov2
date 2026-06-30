import { createServerClient } from '@supabase/ssr'
import type { CookieOptions } from '@supabase/ssr'

type Cookie = {
  name: string
  value: string
  options?: CookieOptions
}

export function createServerSupabaseClient(request: Request, response: Response) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll(cookiesToSet: Cookie[]) {
          cookiesToSet.forEach(({ name, value }) => {
            response.headers.append(
              'Set-Cookie',
              `${name}=${value}; Path=/`
            )
          })
        },
      },
    }
  )
}