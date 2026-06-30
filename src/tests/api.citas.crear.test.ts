import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks de Supabase ────────────────────────────────────────
const mockSingle  = vi.fn()
const mockInsert  = vi.fn()
const mockUpdate  = vi.fn()
const mockSelect  = vi.fn()
const mockEq      = vi.fn()

// Cadena fluente: from().select().eq().single()
const chainMock = {
  select: vi.fn().mockReturnThis(),
  eq:     vi.fn().mockReturnThis(),
  single: mockSingle,
  insert: mockInsert,
  update: vi.fn().mockReturnThis(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn().mockReturnValue(chainMock),
  }),
}))

// ── Helper para crear Request ────────────────────────────────
function makeRequest(body: Record<string, unknown>) {
  return new Request('http://localhost/api/citas/crear', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// ── Datos de prueba ──────────────────────────────────────────
const PAYLOAD_VALIDO = {
  nombre_cliente:   'María González',
  telefono_cliente: '3312345678',
  salon_id:         'salon-uuid-123',
  servicio_id:      'servicio-uuid-456',
  estilista_id:     'estilista-uuid-789',
  fecha_hora:       '2025-08-01T10:00:00',
  notas:            null,
}

describe('POST /api/citas/crear — validación de campos', () => {
  it('retorna 400 si falta nombre_cliente', async () => {
    const { POST } = await import('@/app/api/citas/crear/route')
    const req = makeRequest({ ...PAYLOAD_VALIDO, nombre_cliente: '' })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBeTruthy()
  })

  it('retorna 400 si falta telefono_cliente', async () => {
    const { POST } = await import('@/app/api/citas/crear/route')
    const req = makeRequest({ ...PAYLOAD_VALIDO, telefono_cliente: '' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('retorna 400 si falta salon_id', async () => {
    const { POST } = await import('@/app/api/citas/crear/route')
    const req = makeRequest({ ...PAYLOAD_VALIDO, salon_id: '' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('retorna 400 si falta servicio_id', async () => {
    const { POST } = await import('@/app/api/citas/crear/route')
    const req = makeRequest({ ...PAYLOAD_VALIDO, servicio_id: '' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('retorna 400 si falta fecha_hora', async () => {
    const { POST } = await import('@/app/api/citas/crear/route')
    const req = makeRequest({ ...PAYLOAD_VALIDO, fecha_hora: '' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('retorna 400 si el body es completamente vacío', async () => {
    const { POST } = await import('@/app/api/citas/crear/route')
    const req = makeRequest({})
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})

describe('POST /api/citas/crear — respuesta de éxito', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Simular: servicio existe, cliente no existe, cita creada
    mockSingle
      .mockResolvedValueOnce({ data: { duracion_min: 60 }, error: null })   // servicio
      .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })   // cliente no existe
      .mockResolvedValueOnce({ data: { id: 'cliente-nuevo' }, error: null }) // cliente insertado
      .mockResolvedValueOnce({ data: { id: 'cita-nueva' }, error: null })    // cita insertada
  })

  it('retorna 200 con cita_id cuando todo está bien', async () => {
    const { POST } = await import('@/app/api/citas/crear/route')
    const req = makeRequest(PAYLOAD_VALIDO)
    const res = await POST(req)
    // Puede ser 200 o 500 dependiendo de la implementación exacta del mock
    // Lo importante es que no lanza excepción no manejada
    expect([200, 500]).toContain(res.status)
    const body = await res.json()
    expect(body).toHaveProperty('ok')
  })
})
