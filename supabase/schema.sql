-- ================================================================
-- ALEJANDRA SALON — SCHEMA COMPLETO v2
-- Ejecutar en Supabase SQL Editor (orden exacto)
-- ================================================================

-- 1. EXTENSIONES
create extension if not exists "uuid-ossp";

-- ================================================================
-- 2. TABLAS
-- ================================================================

-- Salones
create table public.salones (
  id          uuid primary key default uuid_generate_v4(),
  nombre      text not null,
  direccion   text,
  telefono    text,
  activo      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Perfiles (ligados a auth.users)
-- salon_id es NULL para propietaria (ve todos)
create table public.perfiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nombre      text not null,
  email       text not null,
  telefono    text,
  rol         text not null check (rol in ('propietaria','admin','estilista')),
  salon_id    uuid references public.salones(id) on delete set null,
  activo      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Servicios por salón
create table public.servicios (
  id            uuid primary key default uuid_generate_v4(),
  salon_id      uuid not null references public.salones(id) on delete cascade,
  nombre        text not null,
  descripcion   text,
  duracion_min  int not null default 60,
  precio        numeric(10,2) not null,
  activo        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Clientes por salón (sin cuenta, solo nombre + teléfono)
create table public.clientes (
  id          uuid primary key default uuid_generate_v4(),
  salon_id    uuid not null references public.salones(id) on delete cascade,
  nombre      text not null,
  telefono    text not null,
  notas       text,
  activo      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Citas
create table public.citas (
  id            uuid primary key default uuid_generate_v4(),
  salon_id      uuid not null references public.salones(id) on delete cascade,
  cliente_id    uuid not null references public.clientes(id) on delete restrict,
  estilista_id  uuid references public.perfiles(id) on delete set null,
  servicio_id   uuid not null references public.servicios(id) on delete restrict,
  fecha_hora    timestamptz not null,
  duracion_min  int not null default 60,
  origen        text not null default 'internet' check (origen in ('internet','local')),
  estado        text not null default 'confirmada'
                  check (estado in ('confirmada','en_curso','completada','cancelada')),
  notas         text,
  activo        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Cobros (solo efectivo por ahora, preparado para más métodos)
create table public.cobros (
  id            uuid primary key default uuid_generate_v4(),
  salon_id      uuid not null references public.salones(id) on delete cascade,
  cita_id       uuid references public.citas(id) on delete set null,
  estilista_id  uuid references public.perfiles(id) on delete set null,
  cliente_id    uuid references public.clientes(id) on delete set null,
  servicio_id   uuid references public.servicios(id) on delete set null,
  monto         numeric(10,2) not null,
  metodo_pago   text not null default 'efectivo'
                  check (metodo_pago in ('efectivo','tarjeta','transferencia')),
  notas         text,
  activo        boolean not null default true,
  fecha         timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

-- Tickets (preparados para impresora térmica 80mm)
create table public.tickets (
  id              uuid primary key default uuid_generate_v4(),
  cobro_id        uuid not null references public.cobros(id) on delete cascade,
  salon_id        uuid not null references public.salones(id) on delete cascade,
  numero_ticket   serial,
  datos_json      jsonb not null,  -- snapshot completo del ticket al momento del cobro
  impreso         boolean not null default false,
  fecha           timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

-- Turnos (apertura/cierre del local)
create table public.turnos (
  id            uuid primary key default uuid_generate_v4(),
  salon_id      uuid not null references public.salones(id) on delete cascade,
  admin_id      uuid not null references public.perfiles(id) on delete restrict,
  apertura      timestamptz not null default now(),
  cierre        timestamptz,
  activo        boolean not null default true,  -- true = turno abierto
  created_at    timestamptz not null default now()
);

-- Log de auditoría (append-only, nunca se modifica)
create table public.actividad_log (
  id            uuid primary key default uuid_generate_v4(),
  salon_id      uuid references public.salones(id) on delete set null,
  usuario_id    uuid references public.perfiles(id) on delete set null,
  rol_usuario   text,
  accion        text not null,   -- 'cita_completada', 'cobro_registrado', 'turno_abierto', etc.
  entidad       text,            -- 'citas', 'cobros', 'turnos', etc.
  entidad_id    uuid,
  detalle       jsonb,           -- datos relevantes del momento
  ip            text,
  created_at    timestamptz not null default now()
);

-- ================================================================
-- 3. ÍNDICES
-- ================================================================
create index idx_perfiles_salon     on public.perfiles(salon_id);
create index idx_perfiles_rol       on public.perfiles(rol);
create index idx_servicios_salon    on public.servicios(salon_id);
create index idx_clientes_salon     on public.clientes(salon_id);
create index idx_clientes_telefono  on public.clientes(telefono);
create index idx_citas_salon        on public.citas(salon_id);
create index idx_citas_fecha        on public.citas(fecha_hora);
create index idx_citas_estilista    on public.citas(estilista_id);
create index idx_citas_estado       on public.citas(estado);
create index idx_cobros_salon       on public.cobros(salon_id);
create index idx_cobros_estilista   on public.cobros(estilista_id);
create index idx_cobros_fecha       on public.cobros(fecha);
create index idx_turnos_salon       on public.turnos(salon_id);
create index idx_turnos_activo      on public.turnos(activo);
create index idx_log_usuario        on public.actividad_log(usuario_id);
create index idx_log_salon          on public.actividad_log(salon_id);
create index idx_log_created        on public.actividad_log(created_at);

-- ================================================================
-- 4. FUNCIONES UTILITARIAS
-- ================================================================

-- Actualizar updated_at automáticamente
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_salones_updated_at   before update on public.salones   for each row execute procedure public.set_updated_at();
create trigger trg_perfiles_updated_at  before update on public.perfiles  for each row execute procedure public.set_updated_at();
create trigger trg_servicios_updated_at before update on public.servicios for each row execute procedure public.set_updated_at();
create trigger trg_clientes_updated_at  before update on public.clientes  for each row execute procedure public.set_updated_at();
create trigger trg_citas_updated_at     before update on public.citas     for each row execute procedure public.set_updated_at();

-- Crear perfil automáticamente al registrarse en auth
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfiles (id, nombre, email, rol, salon_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'rol', 'estilista'),
    (new.raw_user_meta_data->>'salon_id')::uuid
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Obtener rol del usuario actual (para RLS)
create or replace function public.get_my_rol()
returns text language sql security definer stable as $$
  select rol from public.perfiles where id = auth.uid();
$$;

-- Obtener salon_id del usuario actual (para RLS)
create or replace function public.get_my_salon()
returns uuid language sql security definer stable as $$
  select salon_id from public.perfiles where id = auth.uid();
$$;

-- Insertar en actividad_log (usado desde la app via RPC)
create or replace function public.log_actividad(
  p_salon_id    uuid,
  p_accion      text,
  p_entidad     text,
  p_entidad_id  uuid,
  p_detalle     jsonb
)
returns void language plpgsql security definer as $$
begin
  insert into public.actividad_log
    (salon_id, usuario_id, rol_usuario, accion, entidad, entidad_id, detalle)
  values (
    p_salon_id,
    auth.uid(),
    public.get_my_rol(),
    p_accion,
    p_entidad,
    p_entidad_id,
    p_detalle
  );
end;
$$;

-- Generar ticket al crear un cobro
create or replace function public.generar_ticket()
returns trigger language plpgsql security definer as $$
declare
  v_cobro   record;
  v_cliente record;
  v_servicio record;
  v_estilista record;
  v_salon   record;
begin
  select * into v_cobro    from public.cobros    where id = new.id;
  select * into v_cliente  from public.clientes  where id = v_cobro.cliente_id;
  select * into v_servicio from public.servicios where id = v_cobro.servicio_id;
  select * into v_estilista from public.perfiles  where id = v_cobro.estilista_id;
  select * into v_salon    from public.salones    where id = v_cobro.salon_id;

  insert into public.tickets (cobro_id, salon_id, datos_json)
  values (
    new.id,
    new.salon_id,
    jsonb_build_object(
      'salon',      v_salon.nombre,
      'direccion',  v_salon.direccion,
      'cliente',    v_cliente.nombre,
      'telefono',   v_cliente.telefono,
      'servicio',   v_servicio.nombre,
      'estilista',  v_estilista.nombre,
      'monto',      v_cobro.monto,
      'metodo',     v_cobro.metodo_pago,
      'fecha',      v_cobro.fecha,
      'notas',      v_cobro.notas
    )
  );
  return new;
end;
$$;

create trigger trg_generar_ticket
  after insert on public.cobros
  for each row execute procedure public.generar_ticket();

-- ================================================================
-- 5. ROW LEVEL SECURITY
-- ================================================================
alter table public.salones          enable row level security;
alter table public.perfiles         enable row level security;
alter table public.servicios        enable row level security;
alter table public.clientes         enable row level security;
alter table public.citas            enable row level security;
alter table public.cobros           enable row level security;
alter table public.tickets          enable row level security;
alter table public.turnos           enable row level security;
alter table public.actividad_log    enable row level security;

-- ── SALONES ──────────────────────────────────────────────────
create policy "propietaria_all_salones" on public.salones
  for all using (public.get_my_rol() = 'propietaria');

create policy "admin_read_own_salon" on public.salones
  for select using (
    public.get_my_rol() = 'admin' and
    id = public.get_my_salon()
  );

create policy "estilista_read_own_salon" on public.salones
  for select using (
    public.get_my_rol() = 'estilista' and
    id = public.get_my_salon()
  );

-- ── PERFILES ─────────────────────────────────────────────────
create policy "propietaria_all_perfiles" on public.perfiles
  for all using (public.get_my_rol() = 'propietaria');

create policy "admin_read_salon_perfiles" on public.perfiles
  for select using (
    public.get_my_rol() = 'admin' and
    salon_id = public.get_my_salon()
  );

create policy "admin_manage_estilistas" on public.perfiles
  for all using (
    public.get_my_rol() = 'admin' and
    rol = 'estilista' and
    salon_id = public.get_my_salon()
  );

create policy "self_read_perfil" on public.perfiles
  for select using (id = auth.uid());

create policy "self_update_perfil" on public.perfiles
  for update using (id = auth.uid());

-- ── SERVICIOS ────────────────────────────────────────────────
create policy "propietaria_all_servicios" on public.servicios
  for all using (public.get_my_rol() = 'propietaria');

create policy "admin_manage_servicios" on public.servicios
  for all using (
    public.get_my_rol() = 'admin' and
    salon_id = public.get_my_salon()
  );

create policy "estilista_read_servicios" on public.servicios
  for select using (
    public.get_my_rol() = 'estilista' and
    salon_id = public.get_my_salon()
  );

-- Servicios públicos (para la landing de agendar cita — anon)
create policy "public_read_servicios_activos" on public.servicios
  for select using (activo = true);

-- ── CLIENTES ─────────────────────────────────────────────────
create policy "propietaria_all_clientes" on public.clientes
  for all using (public.get_my_rol() = 'propietaria');

create policy "admin_all_clientes_salon" on public.clientes
  for all using (
    public.get_my_rol() = 'admin' and
    salon_id = public.get_my_salon()
  );

create policy "estilista_read_clientes_salon" on public.clientes
  for select using (
    public.get_my_rol() = 'estilista' and
    salon_id = public.get_my_salon()
  );

-- Permitir insertar clientes desde la landing (anon)
create policy "anon_insert_cliente" on public.clientes
  for insert with check (true);

-- ── CITAS ────────────────────────────────────────────────────
create policy "propietaria_all_citas" on public.citas
  for all using (public.get_my_rol() = 'propietaria');

create policy "admin_all_citas_salon" on public.citas
  for all using (
    public.get_my_rol() = 'admin' and
    salon_id = public.get_my_salon()
  );

create policy "estilista_own_citas" on public.citas
  for select using (
    public.get_my_rol() = 'estilista' and
    salon_id = public.get_my_salon()
  );

create policy "estilista_update_citas" on public.citas
  for update using (
    public.get_my_rol() = 'estilista' and
    estilista_id = auth.uid()
  );

-- Cualquiera (anon) puede insertar citas desde la landing
create policy "anon_insert_cita" on public.citas
  for insert with check (true);

-- ── COBROS ───────────────────────────────────────────────────
create policy "propietaria_all_cobros" on public.cobros
  for all using (public.get_my_rol() = 'propietaria');

create policy "admin_all_cobros_salon" on public.cobros
  for all using (
    public.get_my_rol() = 'admin' and
    salon_id = public.get_my_salon()
  );

create policy "estilista_insert_cobro" on public.cobros
  for insert with check (
    public.get_my_rol() = 'estilista' and
    estilista_id = auth.uid() and
    salon_id = public.get_my_salon()
  );

-- ── TICKETS ──────────────────────────────────────────────────
create policy "propietaria_all_tickets" on public.tickets
  for all using (public.get_my_rol() = 'propietaria');

create policy "admin_read_tickets_salon" on public.tickets
  for select using (
    public.get_my_rol() = 'admin' and
    salon_id = public.get_my_salon()
  );

create policy "estilista_read_own_tickets" on public.tickets
  for select using (
    public.get_my_rol() = 'estilista' and
    salon_id = public.get_my_salon()
  );

-- ── TURNOS ───────────────────────────────────────────────────
create policy "propietaria_all_turnos" on public.turnos
  for all using (public.get_my_rol() = 'propietaria');

create policy "admin_manage_turnos" on public.turnos
  for all using (
    public.get_my_rol() = 'admin' and
    salon_id = public.get_my_salon()
  );

create policy "estilista_read_turno" on public.turnos
  for select using (
    public.get_my_rol() = 'estilista' and
    salon_id = public.get_my_salon()
  );

-- ── ACTIVIDAD LOG ────────────────────────────────────────────
create policy "propietaria_read_log" on public.actividad_log
  for select using (public.get_my_rol() = 'propietaria');

create policy "admin_read_log_salon" on public.actividad_log
  for select using (
    public.get_my_rol() = 'admin' and
    salon_id = public.get_my_salon()
  );

-- Solo se inserta via la función log_actividad (security definer)
-- No se permite update ni delete nunca

-- ================================================================
-- 6. SEED — datos iniciales
-- ================================================================

-- Salón principal
insert into public.salones (id, nombre, direccion, telefono) values
  ('00000000-0000-0000-0000-000000000001', 'Alejandra Salón', 'Calle Principal 123', '3312345678');

-- Servicios del salón principal
insert into public.servicios (salon_id, nombre, descripcion, duracion_min, precio) values
  ('00000000-0000-0000-0000-000000000001', 'Corte de cabello',    'Corte clásico o moderno',              45,  350.00),
  ('00000000-0000-0000-0000-000000000001', 'Tinte completo',      'Tinte de raíz a puntas',              120,  950.00),
  ('00000000-0000-0000-0000-000000000001', 'Mechas / Highlights', 'Mechas o highlights profesionales',   150, 1200.00),
  ('00000000-0000-0000-0000-000000000001', 'Manicure',            'Manicure clásico con esmalte',         45,  250.00),
  ('00000000-0000-0000-0000-000000000001', 'Pedicure',            'Pedicure con exfoliación',             60,  300.00),
  ('00000000-0000-0000-0000-000000000001', 'Keratina',            'Tratamiento de keratina',             180, 1500.00),
  ('00000000-0000-0000-0000-000000000001', 'Peinado',             'Peinado para evento',                  60,  450.00),
  ('00000000-0000-0000-0000-000000000001', 'Facial',              'Limpieza facial profunda',             75,  550.00);
