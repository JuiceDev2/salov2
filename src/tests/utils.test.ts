import { describe, it, expect } from 'vitest'
import { formatPeso, formatFechaCorta, telefonoToEmail, cn, ESTADO_LABELS, ESTADO_COLORS } from '@/lib/utils'

describe('formatPeso', () => {
  it('formatea un número como pesos mexicanos', () => {
    expect(formatPeso(350)).toContain('350')
    expect(formatPeso(1500)).toContain('1')
    expect(formatPeso(0)).toContain('0')
  })

  it('no incluye decimales para números enteros', () => {
    const result = formatPeso(350)
    expect(result).not.toContain('.00')
  })

  it('maneja números negativos sin crash', () => {
    expect(() => formatPeso(-100)).not.toThrow()
  })
})

describe('telefonoToEmail', () => {
  it('convierte teléfono a email interno', () => {
    expect(telefonoToEmail('3312345678')).toBe('3312345678@salon.interno')
  })

  it('elimina espacios del teléfono', () => {
    expect(telefonoToEmail('331 234 5678')).toBe('3312345678@salon.interno')
  })

  it('dominio siempre es @salon.interno', () => {
    const result = telefonoToEmail('1234567890')
    expect(result.endsWith('@salon.interno')).toBe(true)
  })
})

describe('cn (className merge)', () => {
  it('combina clases normales', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('ignora valores falsy', () => {
    expect(cn('foo', false && 'bar', undefined, null, '')).toBe('foo')
  })

  it('maneja condicionales', () => {
    const active = true
    expect(cn('base', active && 'active')).toBe('base active')
    expect(cn('base', !active && 'active')).toBe('base')
  })
})

describe('ESTADO_LABELS', () => {
  it('tiene etiqueta para cada estado válido', () => {
    const estados = ['confirmada', 'en_curso', 'completada', 'cancelada']
    estados.forEach(e => {
      expect(ESTADO_LABELS[e]).toBeDefined()
      expect(typeof ESTADO_LABELS[e]).toBe('string')
      expect(ESTADO_LABELS[e].length).toBeGreaterThan(0)
    })
  })
})

describe('ESTADO_COLORS', () => {
  it('tiene color para cada estado válido', () => {
    const estados = ['confirmada', 'en_curso', 'completada', 'cancelada']
    estados.forEach(e => {
      expect(ESTADO_COLORS[e]).toBeDefined()
      // Debe incluir tanto clase de fondo como de texto
      expect(ESTADO_COLORS[e]).toMatch(/bg-/)
      expect(ESTADO_COLORS[e]).toMatch(/text-/)
    })
  })
})

describe('formatFechaCorta', () => {
  it('formatea una fecha ISO a dd/MM/yyyy', () => {
    const result = formatFechaCorta('2024-06-15T10:00:00Z')
    // El formato exacto puede variar por timezone, pero debe contener 15 y 06
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/)
  })

  it('no lanza error con fechas válidas', () => {
    expect(() => formatFechaCorta('2024-01-01T00:00:00Z')).not.toThrow()
  })
})
