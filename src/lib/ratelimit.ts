/**
 * Rate limiting con Upstash Redis.
 *
 * En producción: configura UPSTASH_REDIS_REST_URL y UPSTASH_REDIS_REST_TOKEN
 * en Vercel → Settings → Environment Variables.
 * Obtén las credenciales en console.upstash.com (plan gratuito alcanza).
 *
 * En desarrollo local: si no están configuradas, cae a un Map en memoria
 * que funciona igual pero solo para una instancia.
 */

// ── Fallback en memoria (desarrollo / instancia única) ────────
const fallbackMap = new Map<string, { count: number; resetAt: number }>()

function checkFallback(key: string, maxRequests: number, windowMs: number): boolean {
  const now    = Date.now()
  const record = fallbackMap.get(key)

  if (!record || now > record.resetAt) {
    fallbackMap.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (record.count >= maxRequests) return false
  record.count++
  return true
}

// ── Rate limiter principal ────────────────────────────────────
interface RateLimitResult {
  allowed:   boolean
  remaining: number
  resetAt:   number
}

/**
 * Verifica si una clave (IP, user_id, etc.) puede hacer una request.
 * @param key         Identificador único (ej. "citas:192.168.1.1")
 * @param maxRequests Máximo de requests permitidos en la ventana
 * @param windowMs    Ventana de tiempo en milisegundos
 */
export async function checkRateLimit(
  key: string,
  maxRequests = 5,
  windowMs    = 60_000,
): Promise<RateLimitResult> {
  const url   = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  // Sin Upstash configurado → fallback en memoria
  if (!url || !token) {
    const allowed = checkFallback(key, maxRequests, windowMs)
    return { allowed, remaining: allowed ? maxRequests - 1 : 0, resetAt: Date.now() + windowMs }
  }

  try {
    // Sliding window con Redis INCR + EXPIRE
    const redisKey = `rl:${key}`
    const windowSec = Math.ceil(windowMs / 1000)

    // Pipeline: INCR + TTL en una sola round-trip
    const res = await fetch(`${url}/pipeline`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([
        ['INCR', redisKey],
        ['TTL',  redisKey],
      ]),
    })

    if (!res.ok) throw new Error(`Redis error: ${res.status}`)

    const [[, count], [, ttl]] = (await res.json()) as [[string, number], [string, number]]

    // Si es la primera request de esta ventana, poner TTL
    if (count === 1 || ttl < 0) {
      await fetch(`${url}/expire/${redisKey}/${windowSec}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    }

    const allowed   = count <= maxRequests
    const remaining = Math.max(0, maxRequests - count)
    const resetAt   = Date.now() + (ttl > 0 ? ttl * 1000 : windowMs)

    return { allowed, remaining, resetAt }

  } catch (err) {
    // Si Redis falla, permitir la request (fail open) y loguear
    console.error('Rate limit Redis error, fail open:', err)
    return { allowed: true, remaining: maxRequests, resetAt: Date.now() + windowMs }
  }
}
