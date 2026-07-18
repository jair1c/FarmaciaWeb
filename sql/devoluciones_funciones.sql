-- =========================================================
-- Módulo de Devoluciones / Anulaciones
-- Una devolución puede cubrir una o varias líneas de una venta, con
-- cantidades parciales. El stock devuelto regresa al MISMO lote del
-- que salió originalmente (para no romper el rastro de vencimientos).
-- Si se devuelve todo lo vendido en una venta, esa venta pasa
-- automáticamente a estado_pago = 'ANULADO'.
--
-- Requiere que sql/fix_recursion_rls.sql ya esté aplicado (usa is_admin()).
-- =========================================================

create table devoluciones (
  id uuid primary key default uuid_generate_v4(),
  venta_id uuid not null references ventas(id),
  usuario_id uuid not null references perfiles(id),
  motivo text,
  monto_total numeric(10,2) not null default 0,
  creado_en timestamptz not null default now()
);

create table devolucion_detalle (
  id uuid primary key default uuid_generate_v4(),
  devolucion_id uuid not null references devoluciones(id) on delete cascade,
  venta_detalle_id uuid not null references venta_detalle(id),
  producto_id uuid not null references productos(id),
  lote_id uuid not null references lotes(id),
  cantidad integer not null check (cantidad > 0),
  precio_unitario numeric(10,2) not null,
  monto numeric(10,2) not null
);

alter table devoluciones enable row level security;
alter table devolucion_detalle enable row level security;

create policy "devoluciones_select" on devoluciones
  for select using (
    venta_id in (
      select id from ventas where
        sucursal_id in (select sucursal_id from perfiles where id = auth.uid())
        or is_admin()
    )
  );

create policy "devoluciones_insert" on devoluciones
  for insert with check (
    venta_id in (
      select id from ventas where
        sucursal_id in (select sucursal_id from perfiles where id = auth.uid())
        or is_admin()
    )
  );

create policy "devolucion_detalle_select" on devolucion_detalle
  for select using (
    devolucion_id in (
      select id from devoluciones where venta_id in (
        select id from ventas where
          sucursal_id in (select sucursal_id from perfiles where id = auth.uid())
          or is_admin()
      )
    )
  );

create policy "devolucion_detalle_insert" on devolucion_detalle
  for insert with check (
    devolucion_id in (
      select id from devoluciones where venta_id in (
        select id from ventas where
          sucursal_id in (select sucursal_id from perfiles where id = auth.uid())
          or is_admin()
      )
    )
  );

-- =========================================================
-- registrar_devolucion: procesa una o varias líneas devueltas de una
-- venta, valida que no se devuelva más de lo disponible por línea
-- (descontando devoluciones previas de esa misma línea), regresa el
-- stock al lote original, y anula la venta si ya se devolvió todo.
--
-- p_items esperado: [{ "venta_detalle_id": "...", "cantidad": 2 }, ...]
-- =========================================================
create or replace function registrar_devolucion(
  p_venta_id uuid,
  p_usuario_id uuid,
  p_items jsonb,
  p_motivo text
)
returns uuid as $$
declare
  v_devolucion_id uuid;
  v_item jsonb;
  v_detalle record;
  v_ya_devuelto integer;
  v_disponible integer;
  v_monto_linea numeric(10,2);
  v_monto_total numeric(10,2) := 0;
  v_total_vendido integer;
  v_total_devuelto integer;
begin
  -- Bloquea la venta para serializar devoluciones concurrentes sobre la misma
  perform 1 from ventas where id = p_venta_id for update;

  if not found then
    raise exception 'Venta no encontrada';
  end if;

  insert into devoluciones (venta_id, usuario_id, motivo)
  values (p_venta_id, p_usuario_id, p_motivo)
  returning id into v_devolucion_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_detalle
    from venta_detalle
    where id = (v_item->>'venta_detalle_id')::uuid and venta_id = p_venta_id;

    if not found then
      raise exception 'La línea de venta % no pertenece a esta venta', (v_item->>'venta_detalle_id');
    end if;

    select coalesce(sum(cantidad), 0) into v_ya_devuelto
    from devolucion_detalle
    where venta_detalle_id = v_detalle.id;

    v_disponible := v_detalle.cantidad - v_ya_devuelto;

    if (v_item->>'cantidad')::integer > v_disponible then
      raise exception 'Solo quedan % unidades disponibles para devolver de ese producto', v_disponible;
    end if;

    v_monto_linea := v_detalle.precio_unitario * (v_item->>'cantidad')::integer;
    v_monto_total := v_monto_total + v_monto_linea;

    insert into devolucion_detalle (
      devolucion_id, venta_detalle_id, producto_id, lote_id, cantidad, precio_unitario, monto
    ) values (
      v_devolucion_id, v_detalle.id, v_detalle.producto_id, v_detalle.lote_id,
      (v_item->>'cantidad')::integer, v_detalle.precio_unitario, v_monto_linea
    );

    update lotes
    set cantidad_actual = cantidad_actual + (v_item->>'cantidad')::integer
    where id = v_detalle.lote_id;
  end loop;

  update devoluciones set monto_total = v_monto_total where id = v_devolucion_id;

  -- Si ya se devolvió todo lo vendido en esta venta, se marca como anulada
  select coalesce(sum(cantidad), 0) into v_total_vendido from venta_detalle where venta_id = p_venta_id;
  select coalesce(sum(dd.cantidad), 0) into v_total_devuelto
  from devolucion_detalle dd
  join venta_detalle vd on vd.id = dd.venta_detalle_id
  where vd.venta_id = p_venta_id;

  if v_total_devuelto >= v_total_vendido then
    update ventas set estado_pago = 'ANULADO' where id = p_venta_id;
  end if;

  return v_devolucion_id;
end;
$$ language plpgsql security definer;

-- =========================================================
-- Actualiza cerrar_caja para restar del efectivo esperado las
-- devoluciones en efectivo ocurridas durante el turno.
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
  v_devoluciones_efectivo numeric(10,2);
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
    and estado_pago in ('PAGADO', 'ANULADO')
    and creado_en >= v_turno.abierto_en;

  select coalesce(sum(cb.monto), 0) into v_cobros_efectivo
  from cobranzas cb
  join ventas v on v.id = cb.venta_id
  where v.sucursal_id = v_turno.sucursal_id
    and cb.metodo_pago = 'EFECTIVO'
    and cb.fecha >= v_turno.abierto_en;

  -- Asume que la devolución se paga en efectivo cuando la venta original
  -- fue en efectivo (simplificación razonable para un solo punto de caja)
  select coalesce(sum(d.monto_total), 0) into v_devoluciones_efectivo
  from devoluciones d
  join ventas v on v.id = d.venta_id
  where v.sucursal_id = v_turno.sucursal_id
    and v.metodo_pago = 'EFECTIVO'
    and d.creado_en >= v_turno.abierto_en;

  v_esperado := v_turno.monto_apertura + v_ventas_efectivo + v_cobros_efectivo - v_devoluciones_efectivo;

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
