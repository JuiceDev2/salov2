import { describe, it, expect } from 'vitest'

// Estas pruebas validan la lógica de autorización del middleware
// sin ejecutarlo directamente (requiere Edge Runtime)

// ── Lógica extraída del middleware para testear de forma aislada ──
type Rol = 'propietaria' | 'admin' | 'estilista'

function getRutaPermitida(pathname: string, rol: Rol): boolean {
  if (pathname.startsWith('/propietaria')) return rol === 'propietaria'
  if (pathname.startsWith('/admin'))       return ['propietaria', 'admin'].includes(rol)
  if (pathname.startsWith('/estilista'))   return ['propietaria', 'admin', 'estilista'].includes(rol)
  return true
}

function getRedirectDestino(rol: Rol): string {
  if (rol === 'propietaria') return '/propietaria'
  if (rol === 'admin')       return '/admin'
  return '/estilista'
}

const RUTAS_PUBLICAS = ['/', '/login', '/agendar', '/api/citas/crear']

function esRutaPublica(pathname: string): boolean {
  return RUTAS_PUBLICAS.some(r => pathname === r || pathname.startsWith('/api/citas/crear'))
}

// ── Tests ────────────────────────────────────────────────────

describe('Rutas públicas', () => {
  it('/ es pública', () => expect(esRutaPublica('/')).toBe(true))
  it('/login es pública', () => expect(esRutaPublica('/login')).toBe(true))
  it('/agendar es pública', () => expect(esRutaPublica('/agendar')).toBe(true))
  it('/api/citas/crear es pública', () => expect(esRutaPublica('/api/citas/crear')).toBe(true))
  it('/admin NO es pública', () => expect(esRutaPublica('/admin')).toBe(false))
  it('/estilista NO es pública', () => expect(esRutaPublica('/estilista')).toBe(false))
  it('/propietaria NO es pública', () => expect(esRutaPublica('/propietaria')).toBe(false))
})

describe('Autorización por rol — /propietaria', () => {
  it('propietaria puede acceder', () => expect(getRutaPermitida('/propietaria', 'propietaria')).toBe(true))
  it('admin NO puede acceder a /propietaria', () => expect(getRutaPermitida('/propietaria', 'admin')).toBe(false))
  it('estilista NO puede acceder a /propietaria', () => expect(getRutaPermitida('/propietaria', 'estilista')).toBe(false))
})

describe('Autorización por rol — /admin', () => {
  it('propietaria puede acceder a /admin', () => expect(getRutaPermitida('/admin', 'propietaria')).toBe(true))
  it('admin puede acceder a /admin', () => expect(getRutaPermitida('/admin', 'admin')).toBe(true))
  it('estilista NO puede acceder a /admin', () => expect(getRutaPermitida('/admin', 'estilista')).toBe(false))
})

describe('Autorización por rol — /estilista', () => {
  it('propietaria puede acceder a /estilista', () => expect(getRutaPermitida('/estilista', 'propietaria')).toBe(true))
  it('admin puede acceder a /estilista', () => expect(getRutaPermitida('/estilista', 'admin')).toBe(true))
  it('estilista puede acceder a /estilista', () => expect(getRutaPermitida('/estilista', 'estilista')).toBe(true))
})

describe('Redirección al dashboard correcto', () => {
  it('propietaria → /propietaria', () => expect(getRedirectDestino('propietaria')).toBe('/propietaria'))
  it('admin → /admin', () => expect(getRedirectDestino('admin')).toBe('/admin'))
  it('estilista → /estilista', () => expect(getRedirectDestino('estilista')).toBe('/estilista'))
})

describe('Subrutas heredan protección del padre', () => {
  it('/propietaria/salones solo accesible para propietaria', () => {
    expect(getRutaPermitida('/propietaria/salones', 'propietaria')).toBe(true)
    expect(getRutaPermitida('/propietaria/salones', 'admin')).toBe(false)
  })
  it('/admin/servicios accesible para admin y propietaria', () => {
    expect(getRutaPermitida('/admin/servicios', 'admin')).toBe(true)
    expect(getRutaPermitida('/admin/servicios', 'propietaria')).toBe(true)
    expect(getRutaPermitida('/admin/servicios', 'estilista')).toBe(false)
  })
})
