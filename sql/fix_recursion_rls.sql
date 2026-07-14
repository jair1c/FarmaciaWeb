-- =========================================================
-- CORRECCIÓN CRÍTICA: recursión infinita en políticas RLS
--
-- Las políticas que verificaban "¿eres admin?" consultando la propia
-- tabla `perfiles` dentro de su propia política de seguridad, causaban
-- que Postgres entrara en un ciclo (para leer perfiles, primero tenía
-- que leer perfiles, para lo cual primero tenía que leer perfiles...).
-- Esto se manifestaba como el error intermitente:
--   "infinite recursion detected in policy for relation perfiles"
--
-- La solución: una función SECURITY DEFINER. Al ejecutarse con permisos
-- elevados, su consulta interna a `perfiles` NO vuelve a disparar la
-- política RLS de `perfiles`, rompiendo el ciclo.
-- =========================================================

create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from perfiles where id = auth.uid() and rol = 'admin'
  );
$$;

-- ---------- perfiles ----------
drop policy if exists "perfiles_select" on perfiles;
create policy "perfiles_select" on perfiles
  for select using (auth.uid() = id or is_admin());

drop policy if exists "perfiles_update_admin" on perfiles;
create policy "perfiles_update_admin" on perfiles
  for update using (is_admin());

-- ---------- ventas ----------
drop policy if exists "ventas_select" on ventas;
create policy "ventas_select" on ventas
  for select using (
    sucursal_id in (select sucursal_id from perfiles where id = auth.uid())
    or is_admin()
  );

drop policy if exists "ventas_insert" on ventas;
create policy "ventas_insert" on ventas
  for insert with check (
    sucursal_id in (select sucursal_id from perfiles where id = auth.uid())
    or is_admin()
  );

-- ---------- lotes ----------
drop policy if exists "lotes_select" on lotes;
create policy "lotes_select" on lotes
  for select using (
    sucursal_id in (select sucursal_id from perfiles where id = auth.uid())
    or is_admin()
  );

drop policy if exists "lotes_insert" on lotes;
create policy "lotes_insert" on lotes
  for insert with check (
    sucursal_id in (select sucursal_id from perfiles where id = auth.uid())
    or is_admin()
  );

drop policy if exists "lotes_update" on lotes;
create policy "lotes_update" on lotes
  for update using (
    sucursal_id in (select sucursal_id from perfiles where id = auth.uid())
    or is_admin()
  );

-- ---------- venta_detalle ----------
drop policy if exists "venta_detalle_select" on venta_detalle;
create policy "venta_detalle_select" on venta_detalle
  for select using (
    venta_id in (
      select id from ventas where
        sucursal_id in (select sucursal_id from perfiles where id = auth.uid())
        or is_admin()
    )
  );

drop policy if exists "venta_detalle_insert" on venta_detalle;
create policy "venta_detalle_insert" on venta_detalle
  for insert with check (
    venta_id in (
      select id from ventas where
        sucursal_id in (select sucursal_id from perfiles where id = auth.uid())
        or is_admin()
    )
  );

-- ---------- cobranzas ----------
drop policy if exists "cobranzas_select" on cobranzas;
create policy "cobranzas_select" on cobranzas
  for select using (
    venta_id in (
      select id from ventas where
        sucursal_id in (select sucursal_id from perfiles where id = auth.uid())
        or is_admin()
    )
  );

drop policy if exists "cobranzas_insert" on cobranzas;
create policy "cobranzas_insert" on cobranzas
  for insert with check (
    venta_id in (
      select id from ventas where
        sucursal_id in (select sucursal_id from perfiles where id = auth.uid())
        or is_admin()
    )
  );

-- ---------- sucursales ----------
drop policy if exists "sucursales_insert_admin" on sucursales;
create policy "sucursales_insert_admin" on sucursales
  for insert with check (is_admin());

drop policy if exists "sucursales_update_admin" on sucursales;
create policy "sucursales_update_admin" on sucursales
  for update using (is_admin());
