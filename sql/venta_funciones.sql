-- =========================================================
-- Función: crear_venta
-- Crea la venta y sus detalles en una sola transacción, descontando
-- stock de los lotes más próximos a vencer primero (FEFO).
-- Si un producto no tiene stock suficiente en total, revierte todo.
--
-- items esperado: [{ "producto_id": "...", "cantidad": 2, "precio_unitario": 12.5, "descuento": 0 }, ...]
-- =========================================================
create or replace function crear_venta(
  p_sucursal_id uuid,
  p_usuario_id uuid,
  p_cliente_id uuid,
  p_tipo_comprobante text,
  p_metodo_pago text,
  p_estado_pago text,
  p_items jsonb
)
returns uuid as $$
declare
  v_venta_id uuid;
  v_item jsonb;
  v_restante integer;
  v_lote record;
  v_tomar integer;
  v_subtotal numeric(10,2) := 0;
  v_igv numeric(10,2) := 0;
  v_total numeric(10,2) := 0;
  v_precio numeric(10,2);
  v_descuento numeric(10,2);
begin
  -- Calcular totales primero
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_precio := (v_item->>'precio_unitario')::numeric;
    v_descuento := coalesce((v_item->>'descuento')::numeric, 0);
    v_subtotal := v_subtotal + (v_precio * (v_item->>'cantidad')::integer) - v_descuento;
  end loop;

  v_igv := round(v_subtotal * 0.18, 2);
  v_total := v_subtotal + v_igv;

  insert into ventas (
    sucursal_id, cliente_id, usuario_id, tipo_comprobante,
    metodo_pago, estado_pago, subtotal, igv, total
  ) values (
    p_sucursal_id, p_cliente_id, p_usuario_id, p_tipo_comprobante,
    p_metodo_pago, p_estado_pago, v_subtotal, v_igv, v_total
  ) returning id into v_venta_id;

  -- Descontar stock por lote (FEFO) y crear el detalle
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_restante := (v_item->>'cantidad')::integer;
    v_precio := (v_item->>'precio_unitario')::numeric;

    for v_lote in
      select id, cantidad_actual
      from lotes
      where producto_id = (v_item->>'producto_id')::uuid
        and sucursal_id = p_sucursal_id
        and cantidad_actual > 0
      order by fecha_vencimiento asc
      for update
    loop
      exit when v_restante <= 0;

      v_tomar := least(v_restante, v_lote.cantidad_actual);

      insert into venta_detalle (venta_id, producto_id, lote_id, cantidad, precio_unitario)
      values (v_venta_id, (v_item->>'producto_id')::uuid, v_lote.id, v_tomar, v_precio);
      -- el trigger trg_descontar_stock descuenta cantidad_actual automáticamente

      v_restante := v_restante - v_tomar;
    end loop;

    if v_restante > 0 then
      raise exception 'Stock insuficiente para el producto %', (v_item->>'producto_id');
    end if;
  end loop;

  return v_venta_id;
end;
$$ language plpgsql security definer;
