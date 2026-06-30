import { z } from 'zod'

// ── Helpers ──────────────────────────────────────────────────

const uuid = z.string().uuid('ID inválido')
const telefono = z
  .string()
  .min(10, 'Teléfono mínimo 10 dígitos')
  .max(15, 'Teléfono máximo 15 dígitos')
  .regex(/^[\d\s\-+()]+$/, 'Teléfono contiene caracteres inválidos')
const nombre = z.string().min(2, 'Nombre mínimo 2 caracteres').max(100, 'Nombre demasiado largo').trim()
const fechaISO = z.string().datetime({ message: 'Fecha inválida, usar formato ISO 8601' })

// ── Citas ────────────────────────────────────────────────────

export const crearCitaSchema = z.object({
  nombre_cliente:   nombre,
  telefono_cliente: telefono,
  salon_id:         uuid,
  servicio_id:      uuid,
  estilista_id:     uuid.nullable().optional(),
  fecha_hora:       fechaISO,
  notas:            z.string().max(500).nullable().optional(),
  origen:           z.enum(['internet', 'local']).default('internet'),
})

export type CrearCitaInput = z.infer<typeof crearCitaSchema>

// ── Usuarios ─────────────────────────────────────────────────

export const crearEstilistaSchema = z.object({
  nombre:    nombre,
  telefono:  telefono,
  email:     z.string().email('Email inválido'),
  password:  z.string().min(6, 'Contraseña mínimo 6 caracteres'),
  salon_id:  uuid,
})

export type CrearEstilistaInput = z.infer<typeof crearEstilistaSchema>

export const crearAdminSchema = z.object({
  nombre:    nombre,
  email:     z.string().email('Email inválido'),
  telefono:  telefono.optional(),
  salon_id:  uuid,
})

export type CrearAdminInput = z.infer<typeof crearAdminSchema>

export const resetPasswordSchema = z.object({
  usuario_id:      uuid,
  nueva_password:  z.string().min(6, 'Contraseña mínimo 6 caracteres'),
})

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

// ── Servicios ─────────────────────────────────────────────────

export const crearServicioSchema = z.object({
  salon_id:     uuid,
  nombre:       nombre,
  descripcion:  z.string().max(300).nullable().optional(),
  duracion_min: z.number().int().min(5, 'Mínimo 5 minutos').max(480, 'Máximo 8 horas'),
  precio:       z.number().min(0, 'Precio no puede ser negativo').max(99999, 'Precio demasiado alto'),
})

export type CrearServicioInput = z.infer<typeof crearServicioSchema>

// ── Salones ──────────────────────────────────────────────────

export const crearSalonSchema = z.object({
  nombre:    nombre,
  direccion: z.string().max(200).nullable().optional(),
  telefono:  telefono.optional(),
})

export type CrearSalonInput = z.infer<typeof crearSalonSchema>

// ── Helper: parsear y responder errores de Zod ───────────────

import { NextResponse } from 'next/server'
import type { ZodError } from 'zod'

export function zodError(err: ZodError): NextResponse {
  const mensaje = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
  return NextResponse.json(
    { error: 'Datos inválidos', detalle: mensaje },
    { status: 400 }
  )
}
