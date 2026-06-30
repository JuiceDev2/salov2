import { describe, it, expect } from 'vitest'
import {
  crearCitaSchema,
  crearEstilistaSchema,
  crearAdminSchema,
  resetPasswordSchema,
  crearServicioSchema,
} from '@/lib/validations'

const UUID = '00000000-0000-0000-0000-000000000001'
const FECHA_FUTURA = new Date(Date.now() + 86400000).toISOString() // mañana

// ── crearCitaSchema ──────────────────────────────────────────

describe('crearCitaSchema', () => {
  const base = {
    nombre_cliente:   'María González',
    telefono_cliente: '3312345678',
    salon_id:         UUID,
    servicio_id:      UUID,
    fecha_hora:       FECHA_FUTURA,
  }

  it('acepta datos válidos', () => {
    expect(crearCitaSchema.safeParse(base).success).toBe(true)
  })

  it('rechaza nombre vacío', () => {
    const r = crearCitaSchema.safeParse({ ...base, nombre_cliente: '' })
    expect(r.success).toBe(false)
  })

  it('rechaza nombre de 1 carácter', () => {
    const r = crearCitaSchema.safeParse({ ...base, nombre_cliente: 'A' })
    expect(r.success).toBe(false)
  })

  it('rechaza teléfono con menos de 10 dígitos', () => {
    const r = crearCitaSchema.safeParse({ ...base, telefono_cliente: '123' })
    expect(r.success).toBe(false)
  })

  it('rechaza teléfono con caracteres inválidos', () => {
    const r = crearCitaSchema.safeParse({ ...base, telefono_cliente: 'abc-def-ghij' })
    expect(r.success).toBe(false)
  })

  it('rechaza UUID inválido en salon_id', () => {
    const r = crearCitaSchema.safeParse({ ...base, salon_id: 'no-es-uuid' })
    expect(r.success).toBe(false)
  })

  it('rechaza fecha con formato incorrecto', () => {
    const r = crearCitaSchema.safeParse({ ...base, fecha_hora: '2025-08-01' })
    expect(r.success).toBe(false)
  })

  it('origen default es internet', () => {
    const r = crearCitaSchema.safeParse(base)
    expect(r.success && r.data.origen).toBe('internet')
  })

  it('rechaza origen inválido', () => {
    const r = crearCitaSchema.safeParse({ ...base, origen: 'telefono' })
    expect(r.success).toBe(false)
  })

  it('acepta notas null', () => {
    const r = crearCitaSchema.safeParse({ ...base, notas: null })
    expect(r.success).toBe(true)
  })

  it('rechaza notas de más de 500 caracteres', () => {
    const r = crearCitaSchema.safeParse({ ...base, notas: 'x'.repeat(501) })
    expect(r.success).toBe(false)
  })
})

// ── crearEstilistaSchema ─────────────────────────────────────

describe('crearEstilistaSchema', () => {
  const base = {
    nombre:   'Ana López',
    telefono: '3312345678',
    email:    '3312345678@salon.interno',
    password: 'password123',
    salon_id: UUID,
  }

  it('acepta datos válidos', () => {
    expect(crearEstilistaSchema.safeParse(base).success).toBe(true)
  })

  it('rechaza email inválido', () => {
    const r = crearEstilistaSchema.safeParse({ ...base, email: 'no-es-email' })
    expect(r.success).toBe(false)
  })

  it('rechaza contraseña de menos de 6 caracteres', () => {
    const r = crearEstilistaSchema.safeParse({ ...base, password: '123' })
    expect(r.success).toBe(false)
  })
})

// ── crearAdminSchema ─────────────────────────────────────────

describe('crearAdminSchema', () => {
  const base = { nombre: 'Carlos Admin', email: 'carlos@salon.com', salon_id: UUID }

  it('acepta datos válidos sin teléfono', () => {
    expect(crearAdminSchema.safeParse(base).success).toBe(true)
  })

  it('acepta datos válidos con teléfono', () => {
    const r = crearAdminSchema.safeParse({ ...base, telefono: '3312345678' })
    expect(r.success).toBe(true)
  })

  it('rechaza email inválido', () => {
    const r = crearAdminSchema.safeParse({ ...base, email: 'invalido' })
    expect(r.success).toBe(false)
  })
})

// ── resetPasswordSchema ──────────────────────────────────────

describe('resetPasswordSchema', () => {
  it('acepta datos válidos', () => {
    const r = resetPasswordSchema.safeParse({ usuario_id: UUID, nueva_password: 'abc123' })
    expect(r.success).toBe(true)
  })

  it('rechaza UUID inválido', () => {
    const r = resetPasswordSchema.safeParse({ usuario_id: 'mal-id', nueva_password: 'abc123' })
    expect(r.success).toBe(false)
  })

  it('rechaza contraseña de menos de 6 caracteres', () => {
    const r = resetPasswordSchema.safeParse({ usuario_id: UUID, nueva_password: '12' })
    expect(r.success).toBe(false)
  })
})

// ── crearServicioSchema ──────────────────────────────────────

describe('crearServicioSchema', () => {
  const base = { salon_id: UUID, nombre: 'Corte', duracion_min: 45, precio: 350 }

  it('acepta datos válidos', () => {
    expect(crearServicioSchema.safeParse(base).success).toBe(true)
  })

  it('rechaza duración menor a 5 minutos', () => {
    const r = crearServicioSchema.safeParse({ ...base, duracion_min: 4 })
    expect(r.success).toBe(false)
  })

  it('rechaza precio negativo', () => {
    const r = crearServicioSchema.safeParse({ ...base, precio: -1 })
    expect(r.success).toBe(false)
  })

  it('rechaza precio exagerado', () => {
    const r = crearServicioSchema.safeParse({ ...base, precio: 100000 })
    expect(r.success).toBe(false)
  })
})
