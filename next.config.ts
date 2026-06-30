import type { NextConfig } from 'next'
import { validateEnv } from './src/lib/env'

// Valida variables de entorno en tiempo de build.
// Si falta alguna requerida, el build falla con mensaje claro
// en lugar de explotar en runtime en producción.
validateEnv()

const securityHeaders = [
  // Evita que el browser interprete archivos con MIME diferente al declarado
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Bloquea clickjacking
  { key: 'X-Frame-Options', value: 'DENY' },
  // Fuerza HTTPS (1 año, incluye subdominios)
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // Desactiva XSS auditor legacy y protección del browser moderno
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  // Controla qué información del referrer se envía
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Permisos de APIs del browser — mínimo necesario
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  // Content Security Policy
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Supabase API y realtime
      `connect-src 'self' ${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''} https://*.supabase.co wss://*.supabase.co`,
      // Scripts: solo mismo origen + Next.js inline (necesario para HMR en dev)
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Estilos: inline necesario para Tailwind/CSS-in-JS
      "style-src 'self' 'unsafe-inline'",
      // Imágenes: mismo origen + data URIs
      "img-src 'self' data: blob:",
      // Fuentes
      "font-src 'self' https://fonts.gstatic.com",
      // Forms solo al mismo origen
      "form-action 'self'",
      // No permite ser embebido en frames externos
      "frame-ancestors 'none'",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  // ── Seguridad ────────────────────────────────────────────
  async headers() {
    return [
      {
        // Aplica a todas las rutas
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },

  // ── Imágenes ─────────────────────────────────────────────
  images: {
    // Dominio de Supabase Storage (si se usa en el futuro)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // Formatos modernos en orden de preferencia
    formats: ['image/avif', 'image/webp'],
  },

  // ── Optimizaciones de producción ─────────────────────────
  compress: true,
  poweredByHeader: false,   // Oculta X-Powered-By: Next.js

  // ── TypeScript y ESLint en build ─────────────────────────
  // En producción se ejecutan siempre; esto es solo para CI/CD rápido si se necesita
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },

  // ── Logging en producción ─────────────────────────────────
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
}

export default nextConfig
