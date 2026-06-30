/**
 * Validación de variables de entorno requeridas.
 * Este archivo se importa en next.config.ts para que el build
 * falle inmediatamente si falta alguna variable crítica,
 * en lugar de explotar en runtime cuando ya está en producción.
 */

type EnvVar = {
  name: string
  required: boolean
  serverOnly: boolean  // true = no debe tener prefijo NEXT_PUBLIC_
  description: string
}

const ENV_VARS: EnvVar[] = [
  {
    name:        'NEXT_PUBLIC_SUPABASE_URL',
    required:    true,
    serverOnly:  false,
    description: 'URL del proyecto Supabase (Settings → API → Project URL)',
  },
  {
    name:        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required:    true,
    serverOnly:  false,
    description: 'Clave anon/public de Supabase (Settings → API → anon public)',
  },
  {
    name:        'SUPABASE_SERVICE_ROLE_KEY',
    required:    true,
    serverOnly:  true,
    description: 'Service role key de Supabase — NUNCA exponer al cliente (Settings → API → service_role)',
  },
  {
    name:        'UPSTASH_REDIS_REST_URL',
    required:    false,  // Opcional: cae a fallback en memoria
    serverOnly:  true,
    description: 'URL REST de Upstash Redis para rate limiting (console.upstash.com)',
  },
  {
    name:        'UPSTASH_REDIS_REST_TOKEN',
    required:    false,
    serverOnly:  true,
    description: 'Token de Upstash Redis para rate limiting',
  },
]

export function validateEnv(): void {
  const errors: string[] = []
  const warnings: string[] = []

  for (const v of ENV_VARS) {
    const value = process.env[v.name]

    // Variable requerida ausente → error de build
    if (v.required && !value) {
      errors.push(`❌ FALTA: ${v.name}\n   → ${v.description}`)
      continue
    }

    // Variable opcional ausente → advertencia
    if (!v.required && !value) {
      warnings.push(`⚠  OPCIONAL: ${v.name} no configurada\n   → ${v.description}`)
      continue
    }

    // Verificar que variables serverOnly no estén expuestas al cliente accidentalmente
    if (v.serverOnly && value && v.name.startsWith('NEXT_PUBLIC_')) {
      errors.push(
        `❌ SEGURIDAD: ${v.name} no debe tener prefijo NEXT_PUBLIC_ — quedaría expuesta al browser`
      )
    }

    // Validar formato de URL de Supabase
    if (v.name === 'NEXT_PUBLIC_SUPABASE_URL' && value) {
      try {
        const url = new URL(value)
        if (!url.hostname.endsWith('.supabase.co')) {
          warnings.push(`⚠  ${v.name} no parece una URL de Supabase válida: ${value}`)
        }
      } catch {
        errors.push(`❌ ${v.name} no es una URL válida: ${value}`)
      }
    }
  }

  // Mostrar advertencias (no bloquean)
  if (warnings.length > 0) {
    console.warn('\n🟡 Variables de entorno opcionales no configuradas:')
    warnings.forEach(w => console.warn(`   ${w}`))
    console.warn('')
  }

  // Si hay errores → abortar build
  if (errors.length > 0) {
    console.error('\n🔴 ERROR: Faltan variables de entorno requeridas:\n')
    errors.forEach(e => console.error(`   ${e}\n`))
    console.error('Configúralas en .env.local (desarrollo) o en Vercel → Settings → Environment Variables (producción)\n')
    throw new Error(`Build abortado: ${errors.length} variable(s) de entorno faltante(s)`)
  }
}
