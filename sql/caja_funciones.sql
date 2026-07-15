-- =========================================================
-- Módulo de Control de Caja
-- Un "turno" representa el período entre que se abre y se cierra la
-- caja en una sucursal (normalmente, un día de trabajo). Solo puede
-- haber un turno ABIERTO por sucursal a la vez.
--
-- Requiere que sql/fix_recursion_rls.sql ya esté aplicado (usa la
-- función is_admin() definida ahí).
-- =========================================================

create table turnos_caja (
  id uuid primary key default uuid_generate_v4(),
  sucursal_id uuid not null references sucursales(id),
  usuario_apertura_id uuid not null references perfiles(id),
  usuario_cierre_id uuid references perfiles(id),
  monto_apertura numeric(10,2) not null check (monto_apertura >= 0),
  monto_cierre_contado numeric(10,2),
  monto_cierre_esperado numeric(10,2),
  diferencia numeric(10,2),
  estado text not null default 'ABIERTO' check (estado in ('ABIERTO', 'CERRADO')),
  abierto_en timestamptz not null default now(),
  cerrado_en timestamptz,
  notas text
);

-- Solo un turno abierto por sucursal a la vez
create unique index turnos_caja_una_abierta_por_sucursal
  on turnos_caja (sucursal_id)
  where estado = 'ABIERTO';

alter table turnos_caja enable row level security;

create policy "turnos_caja_select" on turnos_caja
  for select using (
    sucursal_id in (select sucursal_id from perfiles where id = auth.uid())
    or is_admin()
  );

create policy "turnos_caja_insert" on turnos_caja
  for insert with check (
    sucursal_id in (select sucursal_id from perfiles where id = auth.uid())
    or is_admin()
  );

create policy "turnos_caja_update" on turnos_caja
  for update using (
    sucursal_id in (select sucursal_id from perfiles where id = auth.uid())
    or is_admin()
  );

-- =========================================================
-- abrir_caja: crea el turno. Falla si ya hay uno abierto en la sucursal.
-- =========================================================
create or replace function abrir_caja(
  p_sucursal_id uuid,
  p_usuario_id uuid,
  p_monto_apertura numeric
)
returns uuid as $$
declare
  v_turno_id uuid;
begin
  if exists (
    select 1 from turnos_caja where sucursal_id = p_sucursal_id and estado = 'ABIERTO'
  ) then
    raise exception 'Ya hay una caja abierta en esta sucursal';
  end if;

  insert into turnos_caja (sucursal_id, usuario_apertura_id, monto_apertura)
  values (p_sucursal_id, p_usuario_id, p_monto_apertura)
  returning id into v_turno_id;

  return v_turno_id;
end;
$$ language plpgsql security definer;

-- =========================================================
-- cerrar_caja: calcula el efectivo esperado (apertura + ventas en
-- efectivo + cobros en efectivo durante el turno) y lo compara contra
-- lo que el cajero contó físicamente.
-- =========================================================
create or replace function cerrar_caja(
  p_turno_id uuid,
  p_usuario_id uuid,
  p_monto_contado numeric
)
returns void as $$
declare
  v_turno record;
  v_ventas_efectivo numeric(10,2);
  v_cobros_efectivo numeric(10,2);
  v_esperado numeric(10,2);
begin
  select * into v_turno from turnos_caja where id = p_turno_id for update;

  if v_turno is null then
    raise exception 'Turno de caja no encontrado';
  end if;

  if v_turno.estado <> 'ABIERTO' then
    raise exception 'Esta caja ya fue cerrada';
  end if;

  select coalesce(sum(total), 0) into v_ventas_efectivo
  from ventas
  where sucursal_id = v_turno.sucursal_id
    and metodo_pago = 'EFECTIVO'
    and estado_pago = 'PAGADO'
    and creado_en >= v_turno.abierto_en;

  select coalesce(sum(cb.monto), 0) into v_cobros_efectivo
  from cobranzas cb
  join ventas v on v.id = cb.venta_id
  where v.sucursal_id = v_turno.sucursal_id
    and cb.metodo_pago = 'EFECTIVO'
    and cb.fecha >= v_turno.abierto_en;

  v_esperado := v_turno.monto_apertura + v_ventas_efectivo + v_cobros_efectivo;

  update turnos_caja
  set estado = 'CERRADO',
      usuario_cierre_id = p_usuario_id,
      monto_cierre_contado = p_monto_contado,
      monto_cierre_esperado = v_esperado,
      diferencia = p_monto_contado - v_esperado,
      cerrado_en = now()
  where id = p_turno_id;
end;
$$ language plpgsql security definer;
