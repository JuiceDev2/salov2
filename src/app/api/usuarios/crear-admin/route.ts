import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { crearAdminSchema, zodError } from '@/lib/validations'
import { randomBytes } from 'crypto'

function generarPasswordTemporal(): string {
  // 12 caracteres alfanuméricos — más seguro que Math.random
  return randomBytes(9).toString('base64url').slice(0, 12)
}

export async function POST(request: Request) {
  try {
    // ── Auth: solo propietaria ─────────────────────────────
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol, activo')
      .eq('id', user.id)
      .single()

    if (!perfil?.activo || perfil.rol !== 'propietaria') {
      return NextResponse.json({ error: 'Solo la propietaria puede crear admins' }, { status: 403 })
    }

    // ── Validación ─────────────────────────────────────────
    const raw = await request.json().catch(() => null)
    if (!raw) return NextResponse.json({ error: 'Body inválido' }, { status: 400 })

    const parsed = crearAdminSchema.safeParse(raw)
    if (!parsed.success) return zodError(parsed.error)

    const { nombre, email, telefono, salon_id } = parsed.data

    // ── Verificar que salón existe ─────────────────────────
    const { data: salon } = await supabase
      .from('salones')
      .select('id')
      .eq('id', salon_id)
      .eq('activo', true)
      .single()

    if (!salon) return NextResponse.json({ error: 'Salón no encontrado' }, { status: 404 })

    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // ── Verificar email único ──────────────────────────────
    const { data: existente } = await adminSupabase
      .from('perfiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existente) {
      return NextResponse.json({ error: 'Ya existe un usuario con ese email' }, { status: 409 })
    }

    // ── Crear usuario ──────────────────────────────────────
    const tempPassword = generarPasswordTemporal()

    const { data: newUser, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { nombre, rol: 'admin', salon_id },
    })

    if (authError || !newUser.user) {
      return NextResponse.json(
        { error: authError?.message ?? 'Error al crear usuario' },
        { status: 500 }
      )
    }

    if (telefono) {
      await adminSupabase
        .from('perfiles')
        .update({ telefono })
        .eq('id', newUser.user.id)
    }

    return NextResponse.json(
      { ok: true, usuario_id: newUser.user.id, temp_password: tempPassword },
      { status: 201 }
    )

  } catch (err) {
    console.error('POST /api/usuarios/crear-admin:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
