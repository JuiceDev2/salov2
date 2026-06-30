import { createClient } from '@/lib/supabase/server'

type LogParams = {
  salon_id: string | null
  accion: string
  entidad?: string
  entidad_id?: string
  detalle?: Record<string, unknown>
}

export async function logActividad(params: LogParams) {
  const supabase = await createClient()
  await supabase.rpc('log_actividad', {
    p_salon_id:   params.salon_id,
    p_accion:     params.accion,
    p_entidad:    params.entidad ?? null,
    p_entidad_id: params.entidad_id ?? null,
    p_detalle:    params.detalle ?? null,
  })
}
