-- =========================================================
-- Módulo de Reportes
-- Une cada línea vendida con su costo real (el del lote específico
-- que se descontó) para poder calcular utilidad, no solo ingresos.
-- =========================================================
create view vista_reporte_ventas
with (security_invoker = true) as
select
  vd.id as venta_detalle_id,
  v.id as venta_id,
  v.creado_en,
  v.sucursal_id,
  v.estado_pago,
  vd.producto_id,
  p.nombre as producto_nombre,
  vd.cantidad,
  vd.precio_unitario,
  vd.descuento,
  l.costo_unitario,
  (vd.precio_unitario * vd.cantidad - vd.descuento) as ingreso,
  (l.costo_unitario * vd.cantidad) as costo,
  (vd.precio_unitario * vd.cantidad - vd.descuento - l.costo_unitario * vd.cantidad) as utilidad
from venta_detalle vd
join ventas v on v.id = vd.venta_id
join productos p on p.id = vd.producto_id
join lotes l on l.id = vd.lote_id
where v.estado_pago <> 'ANULADO';
