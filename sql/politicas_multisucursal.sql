-- =========================================================
-- Multi-sucursal: el rol 'admin' puede ver/operar todas las sucursales;
-- cajero/farmacéutico siguen restringidos a la suya.
-- Reemplaza las políticas de sucursal_id creadas en politicas_rls.sql
-- =========================================================

drop policy if exists "ventas_por_sucursal" on ventas;
create policy "ventas_select" on ventas
  for select using (
    sucursal_id in (select sucursal_id from perfiles where id = auth.uid())
    or exists (select 1 from perfiles where id = auth.uid() and rol = 'admin')
  );

drop policy if exists "ventas_insert_por_sucursal" on ventas;
create policy "ventas_insert" on ventas
  for insert with check (
    sucursal_id in (select sucursal_id from perfiles where id = auth.uid())
    or exists (select 1 from perfiles where id = auth.uid() and rol = 'admin')
  );

drop policy if exists "lotes_select_por_sucursal" on lotes;
create policy "lotes_select" on lotes
  for select using (
    sucursal_id in (select sucursal_id from perfiles where id = auth.uid())
    or exists (select 1 from perfiles where id = auth.uid() and rol = 'admin')
  );

drop policy if exists "lotes_insert_por_sucursal" on lotes;
create policy "lotes_insert" on lotes
  for insert with check (
    sucursal_id in (select sucursal_id from perfiles where id = auth.uid())
    or exists (select 1 from perfiles where id = auth.uid() and rol = 'admin')
  );

drop policy if exists "lotes_update_por_sucursal" on lotes;
create policy "lotes_update" on lotes
  for update using (
    sucursal_id in (select sucursal_id from perfiles where id = auth.uid())
    or exists (select 1 from perfiles where id = auth.uid() and rol = 'admin')
  );

drop policy if exists "venta_detalle_select" on venta_detalle;
create policy "venta_detalle_select" on venta_detalle
  for select using (
    venta_id in (
      select id from ventas where
        sucursal_id in (select sucursal_id from perfiles where id = auth.uid())
        or exists (select 1 from perfiles where id = auth.uid() and rol = 'admin')
    )
  );

drop policy if exists "venta_detalle_insert" on venta_detalle;
create policy "venta_detalle_insert" on venta_detalle
  for insert with check (
    venta_id in (
      select id from ventas where
        sucursal_id in (select sucursal_id from perfiles where id = auth.uid())
        or exists (select 1 from perfiles where id = auth.uid() and rol = 'admin')
    )
  );

drop policy if exists "cobranzas_select_por_sucursal" on cobranzas;
create policy "cobranzas_select" on cobranzas
  for select using (
    venta_id in (
      select id from ventas where
        sucursal_id in (select sucursal_id from perfiles where id = auth.uid())
        or exists (select 1 from perfiles where id = auth.uid() and rol = 'admin')
    )
  );

drop policy if exists "cobranzas_insert_por_sucursal" on cobranzas;
create policy "cobranzas_insert" on cobranzas
  for insert with check (
    venta_id in (
      select id from ventas where
        sucursal_id in (select sucursal_id from perfiles where id = auth.uid())
        or exists (select 1 from perfiles where id = auth.uid() and rol = 'admin')
    )
  );

-- Solo un admin puede crear/editar sucursales
drop policy if exists "sucursales_insert_admin" on sucursales;
create policy "sucursales_insert_admin" on sucursales
  for insert with check (
    exists (select 1 from perfiles where id = auth.uid() and rol = 'admin')
  );

drop policy if exists "sucursales_update_admin" on sucursales;
create policy "sucursales_update_admin" on sucursales
  for update using (
    exists (select 1 from perfiles where id = auth.uid() and rol = 'admin')
  );

-- Un admin puede ver/editar los perfiles de todo el personal (no solo el suyo)
drop policy if exists "perfiles_propio" on perfiles;
create policy "perfiles_select" on perfiles
  for select using (
    auth.uid() = id or exists (select 1 from perfiles p where p.id = auth.uid() and p.rol = 'admin')
  );

drop policy if exists "perfiles_update_admin" on perfiles;
create policy "perfiles_update_admin" on perfiles
  for update using (
    exists (select 1 from perfiles p where p.id = auth.uid() and p.rol = 'admin')
  );
