-- =========================================================
-- Módulo de Compras
-- Registra el ingreso de mercadería: crea la compra, un lote nuevo
-- por cada línea (con su propio vencimiento) y el detalle asociado.
--
-- items esperado: [{ "producto_id": "...", "cantidad": 100, "costo_unitario": 0.35,
--                     "numero_lote": "L-2026-01", "fecha_vencimiento": "2027-06-01" }, ...]
-- =========================================================
create or replace function crear_compra(
  p_sucursal_id uuid,
  p_usuario_id uuid,
  p_proveedor_id uuid,
  p_numero_documento text,
  p_items jsonb
)
returns uuid as $$
declare
  v_compra_id uuid;
  v_item jsonb;
  v_lote_id uuid;
  v_total numeric(10,2) := 0;
begin
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_total := v_total + (v_item->>'cantidad')::integer * (v_item->>'costo_unitario')::numeric;
  end loop;

  insert into compras (proveedor_id, sucursal_id, usuario_id, numero_documento, total)
  values (p_proveedor_id, p_sucursal_id, p_usuario_id, p_numero_documento, v_total)
  returning id into v_compra_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into lotes (
      producto_id, sucursal_id, numero_lote, fecha_vencimiento,
      cantidad_inicial, cantidad_actual, costo_unitario
    ) values (
      (v_item->>'producto_id')::uuid,
      p_sucursal_id,
      v_item->>'numero_lote',
      (v_item->>'fecha_vencimiento')::date,
      (v_item->>'cantidad')::integer,
      (v_item->>'cantidad')::integer,
      (v_item->>'costo_unitario')::numeric
    ) returning id into v_lote_id;

    insert into compra_detalle (compra_id, producto_id, lote_id, cantidad, costo_unitario)
    values (
      v_compra_id,
      (v_item->>'producto_id')::uuid,
      v_lote_id,
      (v_item->>'cantidad')::integer,
      (v_item->>'costo_unitario')::numeric
    );
  end loop;

  return v_compra_id;
end;
$$ language plpgsql security definer;
