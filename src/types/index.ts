export type Rol = 'propietaria' | 'admin' | 'estilista'
export type EstadoCita = 'confirmada' | 'en_curso' | 'completada' | 'cancelada'
export type OrigenCita = 'internet' | 'local'
export type MetodoPago = 'efectivo' | 'tarjeta' | 'transferencia'

export interface Salon {
  id: string
  nombre: string
  direccion: string | null
  telefono: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

export interface Perfil {
  id: string
  nombre: string
  email: string
  telefono: string | null
  rol: Rol
  salon_id: string | null
  activo: boolean
  created_at: string
  updated_at: string
  salon?: Salon
}

export interface Servicio {
  id: string
  salon_id: string
  nombre: string
  descripcion: string | null
  duracion_min: number
  precio: number
  activo: boolean
  created_at: string
  updated_at: string
}

export interface Cliente {
  id: string
  salon_id: string
  nombre: string
  telefono: string
  notas: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

export interface Cita {
  id: string
  salon_id: string
  cliente_id: string
  estilista_id: string | null
  servicio_id: string
  fecha_hora: string
  duracion_min: number
  origen: OrigenCita
  estado: EstadoCita
  notas: string | null
  activo: boolean
  created_at: string
  updated_at: string
  // joins
  cliente?: Cliente
  estilista?: Perfil
  servicio?: Servicio
}

export interface Cobro {
  id: string
  salon_id: string
  cita_id: string | null
  estilista_id: string | null
  cliente_id: string | null
  servicio_id: string | null
  monto: number
  metodo_pago: MetodoPago
  notas: string | null
  activo: boolean
  fecha: string
  created_at: string
  // joins
  cita?: Cita
  estilista?: Perfil
  cliente?: Cliente
  servicio?: Servicio
}

export interface Ticket {
  id: string
  cobro_id: string
  salon_id: string
  numero_ticket: number
  datos_json: {
    salon: string
    direccion: string | null
    cliente: string
    telefono: string
    servicio: string
    estilista: string
    monto: number
    metodo: MetodoPago
    fecha: string
    notas: string | null
  }
  impreso: boolean
  fecha: string
  created_at: string
}

export interface Turno {
  id: string
  salon_id: string
  admin_id: string
  apertura: string
  cierre: string | null
  activo: boolean
  created_at: string
  admin?: Perfil
}

export interface ActividadLog {
  id: string
  salon_id: string | null
  usuario_id: string | null
  rol_usuario: string | null
  accion: string
  entidad: string | null
  entidad_id: string | null
  detalle: Record<string, unknown> | null
  ip: string | null
  created_at: string
  usuario?: Perfil
}

// ── Formularios ──────────────────────────────────────────────

export interface AgendarCitaForm {
  nombre_cliente: string
  telefono_cliente: string
  salon_id: string
  servicio_id: string
  estilista_id: string
  fecha_hora: string
  notas?: string
}

export interface NuevaCitaLocalForm {
  nombre_cliente: string
  telefono_cliente: string
  servicio_id: string
  notas?: string
}

export interface NuevoServicioForm {
  nombre: string
  descripcion?: string
  duracion_min: number
  precio: number
}

export interface NuevoClienteForm {
  nombre: string
  telefono: string
  notas?: string
}

export interface NuevoSalonForm {
  nombre: string
  direccion?: string
  telefono?: string
}

export interface NuevoAdminForm {
  nombre: string
  email: string
  telefono?: string
  salon_id: string
}

export interface NuevoEstilistaForm {
  nombre: string
  telefono: string
}

// ── Stats ────────────────────────────────────────────────────

export interface StatsSalon {
  salon_id: string
  salon_nombre: string
  ingresos_hoy: number
  ingresos_mes: number
  citas_hoy: number
  citas_mes: number
  clientes_total: number
  citas_pendientes: number
}

export interface StatsGlobales {
  salones_activos: number
  ingresos_totales_mes: number
  citas_totales_hoy: number
  por_salon: StatsSalon[]
}
