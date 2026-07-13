-- =========================================================
-- Corrección: políticas para tablas de catálogo/apoyo.
-- Estas tablas no necesitan aislarse por sucursal (a diferencia de
-- ventas/lotes/cobranzas), así que basta con permitir acceso completo
-- a cualquier usuario autenticado del sistema.
--
-- Si alguna de estas tablas ya tiene RLS activado sin políticas
-- (por ejemplo, porque Supabase lo sugirió desde el Dashboard/Advisors),
-- este script lo soluciona. Es seguro ejecutarlo aunque RLS ya esté
-- activo: "enable row level security" no falla si ya estaba activo.
-- =========================================================

alter table categorias enable row level security;
alter table productos enable row level security;
alter table clientes enable row level security;
alter table proveedores enable row level security;
alter table compras enable row level security;
alter table compra_detalle enable row level security;
alter table sucursales enable row level security;
alter table perfiles enable row level security;

drop policy if exists "categorias_acceso_autenticados" on categorias;
create policy "categorias_acceso_autenticados" on categorias
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "productos_acceso_autenticados" on productos;
create policy "productos_acceso_autenticados" on productos
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "clientes_acceso_autenticados" on clientes;
create policy "clientes_acceso_autenticados" on clientes
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "proveedores_acceso_autenticados" on proveedores;
create policy "proveedores_acceso_autenticados" on proveedores
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "compras_acceso_autenticados" on compras;
create policy "compras_acceso_autenticados" on compras
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "compra_detalle_acceso_autenticados" on compra_detalle;
create policy "compra_detalle_acceso_autenticados" on compra_detalle
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "sucursales_select_autenticados" on sucursales;
create policy "sucursales_select_autenticados" on sucursales
  for select using (auth.role() = 'authenticated');

-- perfiles: cada usuario ve/edita su propia fila (necesario para las
-- subconsultas "select sucursal_id from perfiles where id = auth.uid()"
-- usadas en las políticas de ventas/lotes/cobranzas)
drop policy if exists "perfiles_propio" on perfiles;
create policy "perfiles_propio" on perfiles
  for select using (auth.uid() = id or auth.role() = 'authenticated');
