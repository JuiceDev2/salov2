# Alejandra Salón — Sistema de gestión

Sistema completo para salón de belleza profesional con multi-salón, 4 roles y caja.

## Stack

- **Next.js 15** (App Router, Server Components, Route Handlers)
- **TypeScript 5**
- **Tailwind CSS v4**
- **Supabase** (Auth, PostgreSQL, RLS, RPC)
- **Vercel** (hosting)
- **pnpm** (package manager)

## Roles

| Rol | Acceso |
|-----|--------|
| `propietaria` | Todo. Crea salones y admins. Ve métricas globales. |
| `admin` | Su salón. Abre/cierra turno. Gestiona servicios, estilistas y citas. |
| `estilista` | Sus citas. Completa servicios. Registra cobros. |
| Público | Agenda citas sin cuenta (nombre + teléfono). |

## Setup

### 1. Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Ve a **SQL Editor** y ejecuta `supabase/schema.sql` completo
3. En **Authentication → Settings**, desactiva "Enable email confirmations" (o configura un SMTP)
4. Copia las keys desde **Settings → API**

### 2. Variables de entorno

```bash
cp .env.example .env.local
# Llena las 3 variables requeridas:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY
#
# Opcional pero recomendado para producción:
# UPSTASH_REDIS_REST_URL      → console.upstash.com (plan gratuito)
# UPSTASH_REDIS_REST_TOKEN
```

> El build falla con mensaje claro si falta alguna variable requerida.

### 3. Crear cuenta de propietaria

En Supabase → **Authentication → Users → Add user**:
- Email: el correo de la propietaria
- Password: contraseña segura

Luego en **SQL Editor**:
```sql
update public.perfiles
set rol = 'propietaria', salon_id = null
where email = 'correo@de.la.propietaria.com';
```

### 4. Instalar y correr

```bash
pnpm install
pnpm dev
```

### 5. Deploy en Vercel

```bash
# Con Vercel CLI
pnpm i -g vercel
vercel

# O conecta el repo en vercel.com
# Agrega las variables de entorno en Settings → Environment Variables
```

## Flujo operativo

```
Landing → "Agendar cita" → nombre + tel + servicio → cita confirmada automática

Admin inicia sesión → ve turno cerrado → abre local → dashboard activo
Estilista inicia sesión → ve sus citas del día → completa → cobra en efectivo

Propietaria → ve todos los salones → crea admins → activa/desactiva todo
```

## Estructura del proyecto

```
src/
├── app/
│   ├── page.tsx                    ← Landing pública
│   ├── agendar/                    ← Agendar cita (sin login)
│   ├── login/                      ← Auth admin/estilista
│   ├── (dashboard)/
│   │   ├── layout.tsx              ← Layout con Sidebar
│   │   ├── propietaria/            ← Dashboard propietaria
│   │   ├── admin/                  ← Dashboard + citas + servicios + estilistas + actividad
│   │   └── estilista/              ← Mis citas + cobros locales
│   └── api/
│       ├── auth/callback/          ← OAuth callback
│       ├── citas/crear/            ← Crear cita pública (anon)
│       └── usuarios/               ← Crear estilista/admin, reset password
├── components/layout/              ← Sidebar, PageHeader
├── lib/
│   ├── supabase/server.ts          ← Client para RSC y Route Handlers
│   ├── supabase/browser.ts         ← Client para 'use client'
│   ├── auth.ts                     ← requireAuth, requireRol, getPerfil
│   ├── audit.ts                    ← logActividad helper
│   └── utils.ts                    ← formatPeso, formatFecha, cn
└── types/index.ts                  ← Tipos de dominio completos
```

## Extensiones futuras ya preparadas

- **Impresora térmica**: tabla `tickets` ya existe con `datos_json` estructurado. Solo conectar el handler de impresión.
- **Métodos de pago**: campo `metodo_pago` en `cobros` con check constraint. Solo habilitar en UI.
- **Más estilistas**: RLS filtra por `salon_id` y `estilista_id`. Sin cambios en schema.
- **Reportes avanzados**: toda la data está en Supabase, lista para queries de BI.
