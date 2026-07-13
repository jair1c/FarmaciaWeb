-- =========================================================
-- Corrección: políticas RLS que faltaban desde el schema base.
-- Al activar RLS sin políticas, Postgres bloquea el acceso por completo,
-- así que estas políticas son necesarias para que Productos y Ventas funcionen.
-- Ejecutar después de schema.sql
-- =========================================================

-- ---------- lotes ----------
create policy "lotes_select_por_sucursal" on lotes
  for select using (
    sucursal_id in (select sucursal_id from perfiles where id = auth.uid())
  );

create policy "lotes_insert_por_sucursal" on lotes
  for insert with check (
    sucursal_id in (select sucursal_id from perfiles where id = auth.uid())
  );

create policy "lotes_update_por_sucursal" on lotes
  for update using (
    sucursal_id in (select sucursal_id from perfiles where id = auth.uid())
  );

-- ---------- ventas: faltaba insert ----------
create policy "ventas_insert_por_sucursal" on ventas
  for insert with check (
    sucursal_id in (select sucursal_id from perfiles where id = auth.uid())
  );

-- ---------- venta_detalle ----------
alter table venta_detalle enable row level security;

create policy "venta_detalle_select" on venta_detalle
  for select using (
    venta_id in (
      select id from ventas where sucursal_id in (
        select sucursal_id from perfiles where id = auth.uid()
      )
    )
  );

create policy "venta_detalle_insert" on venta_detalle
  for insert with check (
    venta_id in (
      select id from ventas where sucursal_id in (
        select sucursal_id from perfiles where id = auth.uid()
      )
    )
  );

-- ---------- cobranzas ----------
create policy "cobranzas_select_por_sucursal" on cobranzas
  for select using (
    venta_id in (
      select id from ventas where sucursal_id in (
        select sucursal_id from perfiles where id = auth.uid()
      )
    )
  );

create policy "cobranzas_insert_por_sucursal" on cobranzas
  for insert with check (
    venta_id in (
      select id from ventas where sucursal_id in (
        select sucursal_id from perfiles where id = auth.uid()
      )
    )
  );
