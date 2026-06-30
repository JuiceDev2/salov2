import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { crearCitaSchema, zodError } from '@/lib/validations'
import { checkRateLimit } from '@/lib/ratelimit'

export async function POST(request: Request) {
  try {
    // ── Rate limiting ──────────────────────────────────────
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
      request.headers.get('x-real-ip') ??
      'unknown'

    const { allowed, remaining } = await checkRateLimit(
      `citas:${ip}`,
      5,        // 5 citas por ventana
      60_000,   // ventana de 1 minuto
    )

    if (!allowed) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Espera un momento e intenta de nuevo.' },
        { status: 429, headers: { 'Retry-After': '60', 'X-RateLimit-Remaining': '0' } }
      )
    }

    // ── Validación con Zod ─────────────────────────────────
    const raw = await request.json().catch(() => null)
    if (!raw) {
      return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
    }

    const parsed = crearCitaSchema.safeParse(raw)
    if (!parsed.success) return zodError(parsed.error)

    const {
      nombre_cliente,
      telefono_cliente,
      salon_id,
      servicio_id,
      estilista_id,
      fecha_hora,
      notas,
      origen,
    } = parsed.data

    // ── Validar que la fecha no sea en el pasado ───────────
    if (new Date(fecha_hora) < new Date()) {
      return NextResponse.json(
        { error: 'La fecha de la cita no puede ser en el pasado' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // ── Verificar que el salón existe y está activo ────────
    const { data: salon, error: errSalon } = await supabase
      .from('salones')
      .select('id')
      .eq('id', salon_id)
      .eq('activo', true)
      .single()

    if (errSalon || !salon) {
      return NextResponse.json({ error: 'Salón no encontrado' }, { status: 404 })
    }

    // ── Verificar que el servicio existe y está activo ─────
    const { data: servicio, error: errServicio } = await supabase
      .from('servicios')
      .select('id, duracion_min')
      .eq('id', servicio_id)
      .eq('salon_id', salon_id)
      .eq('activo', true)
      .single()

    if (errServicio || !servicio) {
      return NextResponse.json({ error: 'Servicio no encontrado o inactivo' }, { status: 404 })
    }

    // ── Buscar o crear cliente ─────────────────────────────
    let clienteId: string

    const { data: clienteExistente } = await supabase
      .from('clientes')
      .select('id')
      .eq('salon_id', salon_id)
      .eq('telefono', telefono_cliente.trim())
      .maybeSingle()

    if (clienteExistente) {
      clienteId = clienteExistente.id
      await supabase
        .from('clientes')
        .update({ nombre: nombre_cliente })
        .eq('id', clienteId)
    } else {
      const { data: nuevoCliente, error: errCliente } = await supabase
        .from('clientes')
        .insert({ salon_id, nombre: nombre_cliente, telefono: telefono_cliente.trim() })
        .select('id')
        .single()

      if (errCliente || !nuevoCliente) {
        return NextResponse.json({ error: 'Error al registrar cliente' }, { status: 500 })
      }
      clienteId = nuevoCliente.id
    }

    // ── Crear cita ─────────────────────────────────────────
    const { data: cita, error: errCita } = await supabase
      .from('citas')
      .insert({
        salon_id,
        cliente_id:   clienteId,
        estilista_id: estilista_id ?? null,
        servicio_id,
        fecha_hora,
        duracion_min: servicio.duracion_min,
        estado:       'confirmada',
        origen,
        notas:        notas ?? null,
      })
      .select('id')
      .single()

    if (errCita || !cita) {
      return NextResponse.json({ error: 'Error al crear la cita' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, cita_id: cita.id }, { status: 201 })

  } catch (err) {
    console.error('POST /api/citas/crear:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
