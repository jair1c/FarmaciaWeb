-- =========================================================
-- ESQUEMA DE BASE DE DATOS · Sistema de Farmacia
-- Ejecutar en el SQL Editor de Supabase
-- Preparado desde el inicio para multi-sucursal (sucursal_id)
-- =========================================================

create extension if not exists "uuid-ossp";

-- ---------- Sucursales y usuarios ----------
create table sucursales (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  direccion text,
  ruc text,
  activa boolean not null default true,
  creado_en timestamptz not null default now()
);

-- Perfil extendido del usuario de auth.users
create table perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  rol text not null check (rol in ('admin', 'cajero', 'farmaceutico')),
  sucursal_id uuid references sucursales(id),
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

-- ---------- Catálogo ----------
create table categorias (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null unique
);

create table productos (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  descripcion text,
  categoria_id uuid references categorias(id),
  codigo_barras text unique,
  requiere_receta boolean not null default false,
  precio_venta numeric(10,2) not null check (precio_venta >= 0),
  stock_minimo integer not null default 5,
  unidad_medida text not null default 'unidad', -- caja, blister, unidad, ml, etc.
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

-- Cada lote es stock físico independiente, permite control de vencimientos y costo real (FIFO/FEFO)
create table lotes (
  id uuid primary key default uuid_generate_v4(),
  producto_id uuid not null references productos(id),
  sucursal_id uuid not null references sucursales(id),
  numero_lote text not null,
  fecha_vencimiento date not null,
  cantidad_inicial integer not null check (cantidad_inicial >= 0),
  cantidad_actual integer not null check (cantidad_actual >= 0),
  costo_unitario numeric(10,2) not null check (costo_unitario >= 0),
  creado_en timestamptz not null default now()
);

create index idx_lotes_vencimiento on lotes(fecha_vencimiento);
create index idx_lotes_producto on lotes(producto_id);

-- ---------- Clientes y proveedores ----------
create table clientes (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  tipo_documento text check (tipo_documento in ('DNI', 'RUC', 'SIN_DOCUMENTO')),
  numero_documento text,
  telefono text,
  direccion text,
  creado_en timestamptz not null default now()
);

create table proveedores (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null,
  ruc text,
  telefono text,
  contacto text
);

-- ---------- Ventas ----------
create table ventas (
  id uuid primary key default uuid_generate_v4(),
  sucursal_id uuid not null references sucursales(id),
  cliente_id uuid references clientes(id),
  usuario_id uuid not null references perfiles(id),
  tipo_comprobante text not null check (tipo_comprobante in ('TICKET', 'BOLETA', 'FACTURA')),
  serie text,
  numero integer,
  estado_pago text not null default 'PAGADO' check (estado_pago in ('PAGADO', 'CREDITO', 'PARCIAL', 'ANULADO')),
  metodo_pago text check (metodo_pago in ('EFECTIVO', 'TARJETA', 'YAPE_PLIN', 'TRANSFERENCIA', 'MIXTO')),
  subtotal numeric(10,2) not null default 0,
  igv numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  sunat_estado text, -- pendiente / aceptado / rechazado (cuando aplica factura/boleta electrónica)
  sunat_respuesta jsonb,
  creado_en timestamptz not null default now()
);

create table venta_detalle (
  id uuid primary key default uuid_generate_v4(),
  venta_id uuid not null references ventas(id) on delete cascade,
  producto_id uuid not null references productos(id),
  lote_id uuid not null references lotes(id),
  cantidad integer not null check (cantidad > 0),
  precio_unitario numeric(10,2) not null check (precio_unitario >= 0),
  descuento numeric(10,2) not null default 0
);

-- Pagos asociados a una venta (soporta pagos parciales / crédito)
create table cobranzas (
  id uuid primary key default uuid_generate_v4(),
  venta_id uuid not null references ventas(id),
  monto numeric(10,2) not null check (monto > 0),
  metodo_pago text not null check (metodo_pago in ('EFECTIVO', 'TARJETA', 'YAPE_PLIN', 'TRANSFERENCIA')),
  fecha timestamptz not null default now(),
  registrado_por uuid references perfiles(id)
);

-- ---------- Compras (entrada de mercadería) ----------
create table compras (
  id uuid primary key default uuid_generate_v4(),
  proveedor_id uuid references proveedores(id),
  sucursal_id uuid not null references sucursales(id),
  usuario_id uuid not null references perfiles(id),
  numero_documento text,
  total numeric(10,2) not null default 0,
  creado_en timestamptz not null default now()
);

create table compra_detalle (
  id uuid primary key default uuid_generate_v4(),
  compra_id uuid not null references compras(id) on delete cascade,
  producto_id uuid not null references productos(id),
  lote_id uuid references lotes(id), -- se llena tras crear el lote correspondiente
  cantidad integer not null check (cantidad > 0),
  costo_unitario numeric(10,2) not null check (costo_unitario >= 0)
);

-- =========================================================
-- Trigger: descuenta stock del lote automáticamente al vender
-- =========================================================
create or replace function descontar_stock_lote()
returns trigger as $$
begin
  update lotes
  set cantidad_actual = cantidad_actual - new.cantidad
  where id = new.lote_id;

  if (select cantidad_actual from lotes where id = new.lote_id) < 0 then
    raise exception 'Stock insuficiente en el lote %', new.lote_id;
  end if;

  return new;
end;
$$ language plpgsql;

create trigger trg_descontar_stock
  after insert on venta_detalle
  for each row execute function descontar_stock_lote();

-- =========================================================
-- Row Level Security (activar y ajustar políticas por rol/sucursal)
-- =========================================================
alter table ventas enable row level security;
alter table lotes enable row level security;
alter table cobranzas enable row level security;

-- Ejemplo de política: cada usuario solo ve datos de su sucursal
create policy "ventas_por_sucursal" on ventas
  for select using (
    sucursal_id in (select sucursal_id from perfiles where id = auth.uid())
  );
