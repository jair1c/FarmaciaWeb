-- =========================================================
-- Módulo de Cobranza
-- =========================================================

-- Vista de cuentas por cobrar: ventas al crédito o con pago parcial,
-- con el saldo pendiente ya calculado. security_invoker = true hace que
-- respete el RLS de ventas/cobranzas según el usuario que consulta.
create view vista_cuentas_por_cobrar
with (security_invoker = true) as
select
  v.id as venta_id,
  v.cliente_id,
  c.nombre as cliente_nombre,
  c.numero_documento,
  c.telefono,
  v.total,
  v.estado_pago,
  v.creado_en,
  coalesce(sum(cb.monto), 0) as pagado,
  v.total - coalesce(sum(cb.monto), 0) as saldo
from ventas v
left join clientes c on c.id = v.cliente_id
left join cobranzas cb on cb.venta_id = v.id
where v.estado_pago in ('CREDITO', 'PARCIAL')
group by v.id, c.nombre, c.numero_documento, c.telefono;

-- Registra un pago de forma segura ante pagos concurrentes: bloquea la
-- venta, recalcula el saldo real, valida el monto y actualiza el estado.
create or replace function registrar_pago(
  p_venta_id uuid,
  p_monto numeric,
  p_metodo_pago text,
  p_usuario_id uuid
)
returns void as $$
declare
  v_total numeric(10,2);
  v_pagado numeric(10,2);
  v_saldo numeric(10,2);
begin
  select total into v_total from ventas where id = p_venta_id for update;

  if v_total is null then
    raise exception 'La venta no existe';
  end if;

  select coalesce(sum(monto), 0) into v_pagado from cobranzas where venta_id = p_venta_id;
  v_saldo := v_total - v_pagado;

  if p_monto <= 0 then
    raise exception 'El monto debe ser mayor a cero';
  end if;

  if p_monto > v_saldo then
    raise exception 'El monto (%) supera el saldo pendiente (%)', p_monto, v_saldo;
  end if;

  insert into cobranzas (venta_id, monto, metodo_pago, registrado_por)
  values (p_venta_id, p_monto, p_metodo_pago, p_usuario_id);

  update ventas
  set estado_pago = case when (v_saldo - p_monto) <= 0 then 'PAGADO' else 'PARCIAL' end
  where id = p_venta_id;
end;
$$ language plpgsql security definer;
