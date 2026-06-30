import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { resetPasswordSchema, zodError } from '@/lib/validations'

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

    const parsed = resetPasswordSchema.safeParse(raw)
    if (!parsed.success) return zodError(parsed.error)

    const { usuario_id, nueva_password } = parsed.data

    // ── Verificar que el target es estilista del mismo salón ─
    const { data: target } = await supabase
      .from('perfiles')
      .select('rol, salon_id')
      .eq('id', usuario_id)
      .single()

    if (!target) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Admin solo puede resetear estilistas de su salón
    if (perfil.rol === 'admin') {
      if (target.rol !== 'estilista' || target.salon_id !== perfil.salon_id) {
        return NextResponse.json(
          { error: 'Solo puedes resetear contraseñas de tus estilistas' },
          { status: 403 }
        )
      }
    }

    // Propietaria no puede resetear a otra propietaria
    if (target.rol === 'propietaria' && perfil.rol !== 'propietaria') {
      return NextResponse.json({ error: 'Sin permisos para este usuario' }, { status: 403 })
    }

    // ── Actualizar contraseña ──────────────────────────────
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { error } = await adminSupabase.auth.admin.updateUserById(usuario_id, {
      password: nueva_password,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('POST /api/usuarios/reset-password:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
