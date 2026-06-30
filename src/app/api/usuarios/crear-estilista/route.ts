import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { crearEstilistaSchema, zodError } from '@/lib/validations'

export async function POST(request: Request) {
  try {
    // ── Auth ───────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol, salon_id, activo')
      .eq('id', user.id)
      .single()

    if (!perfil?.activo || !['admin', 'propietaria'].includes(perfil.rol)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    // ── Validación ─────────────────────────────────────────
    const raw = await request.json().catch(() => null)
    if (!raw) return NextResponse.json({ error: 'Body inválido' }, { status: 400 })

    const parsed = crearEstilistaSchema.safeParse(raw)
    if (!parsed.success) return zodError(parsed.error)

    const { nombre, telefono, email, password, salon_id } = parsed.data

    // Admin solo puede crear en su propio salón
    if (perfil.rol === 'admin' && perfil.salon_id !== salon_id) {
      return NextResponse.json({ error: 'No puedes crear estilistas en otro salón' }, { status: 403 })
    }

    // ── Verificar que salón existe ─────────────────────────
    const { data: salon } = await supabase
      .from('salones')
      .select('id')
      .eq('id', salon_id)
      .eq('activo', true)
      .single()

    if (!salon) return NextResponse.json({ error: 'Salón no encontrado' }, { status: 404 })

    // ── Verificar que el email no existe ya ────────────────
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: existente } = await adminSupabase
      .from('perfiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existente) {
      return NextResponse.json({ error: 'Ya existe un usuario con ese teléfono' }, { status: 409 })
    }

    // ── Crear usuario en Auth ──────────────────────────────
    const { data: newUser, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nombre, rol: 'estilista', salon_id },
    })

    if (authError || !newUser.user) {
      return NextResponse.json(
        { error: authError?.message ?? 'Error al crear usuario' },
        { status: 500 }
      )
    }

    // ── Actualizar perfil con teléfono ─────────────────────
    await adminSupabase
      .from('perfiles')
      .update({ telefono })
      .eq('id', newUser.user.id)

    return NextResponse.json({ ok: true, usuario_id: newUser.user.id }, { status: 201 })

  } catch (err) {
    console.error('POST /api/usuarios/crear-estilista:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
