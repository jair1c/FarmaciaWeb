# Farmacia · Administración y Cobranza

Sistema web para administrar inventario (con control de lotes y vencimientos), ventas, cobranza y compras de una farmacia. Preparado desde el inicio para escalar a varias sucursales.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Supabase** (Postgres + Auth + RLS)
- **Tailwind CSS**
- **Nubefact** para facturación electrónica SUNAT (boleta/factura)

## Puesta en marcha

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Crear un proyecto en [supabase.com](https://supabase.com) y ejecutar en orden, en el SQL Editor:
   1. `sql/schema.sql`
   2. `sql/politicas_rls.sql`
   3. `sql/venta_funciones.sql`
   4. `sql/cobranza_funciones.sql`
   5. `sql/compra_funciones.sql`
   6. `sql/reportes_vista.sql`
   7. `sql/politicas_rls_catalogo.sql`
   8. `sql/politicas_multisucursal.sql`
   9. `sql/perfiles_email.sql`

3. Copiar `.env.example` a `.env.local` y completar con las credenciales de tu proyecto Supabase (Settings → API) y, cuando lo tengas, tu token de Nubefact.

4. Crear el primer usuario administrador:
   - En Supabase → Authentication, crea un usuario con su correo/contraseña.
   - Crea antes una fila en `sucursales` (tu primera sucursal).
   - En la tabla `perfiles`, inserta una fila con ese `id` (el mismo que el del usuario de Auth), `nombre`, `email` (el mismo correo), `rol = 'admin'`, `sucursal_id` y `activo = true`.
   - Desde ese usuario admin, ya puedes crear el resto del personal directamente desde Configuración → Personal (no hace falta tocar Supabase de nuevo).

5. Levantar el proyecto:
   ```bash
   npm run dev
   ```

## Estructura del proyecto

```
app/
  login/                 → inicio de sesión
  (dashboard)/            → rutas protegidas (requieren sesión)
    dashboard/            → panel con métricas del día
    productos/             → catálogo + lotes + vencimientos
    ventas/                → punto de venta: búsqueda, carrito y checkout
    ventas/[id]/ticket/    → comprobante imprimible de la venta
    cobranzas/             → cuentas por cobrar y registro de pagos
    compras/               → registro de compras (genera lotes automáticamente)
    reportes/              → ventas del mes, utilidad, más vendidos, vencimientos
    configuracion/         → categorías, proveedores, sucursales y personal (solo admin)
  api/facturacion/        → integración con Nubefact
  api/ventas/             → registra una venta llamando a la función crear_venta
  api/cobranzas/          → registra un pago llamando a la función registrar_pago
  api/compras/            → registra una compra llamando a la función crear_compra
  api/categorias/         → crear/eliminar categorías
  api/proveedores/        → crear/eliminar proveedores
  api/sucursales/         → crear sucursales (solo admin)
  api/usuarios/           → crear personal (Auth + perfil) y activar/desactivar (solo admin)
components/               → Sidebar (filtrado por rol), LoteBadge, CerrarSesionButton, SelectorSucursal
components/pos/            → VentaPOS (carrito), BotonImprimir, EmitirSunatButton
components/productos/      → NuevoProductoModal
components/cobranzas/      → ListaCuentasPorCobrar, RegistrarPagoModal
components/compras/        → NuevaCompraModal
components/configuracion/  → CategoriasPanel, ProveedoresPanel, SucursalesPanel, UsuariosPanel
lib/permisos.ts            → roles, rutas permitidas por rol, requireRol() para proteger páginas
lib/supabase/             → clientes de Supabase (browser, server y admin/service-role)
lib/nubefact.ts            → construcción del payload y envío a la API de Nubefact
sql/schema.sql            → esquema completo de base de datos + RLS
sql/politicas_rls.sql      → políticas RLS adicionales (lotes, venta_detalle, cobranzas)
sql/venta_funciones.sql    → función crear_venta (descuento de stock FEFO, transaccional)
sql/cobranza_funciones.sql → vista de cuentas por cobrar + función registrar_pago
sql/compra_funciones.sql   → función crear_compra (genera lotes automáticamente por línea)
sql/reportes_vista.sql     → vista con costo real por línea vendida (para calcular utilidad)
sql/politicas_rls_catalogo.sql → políticas para categorías, productos, proveedores, clientes, compras
sql/politicas_multisucursal.sql → el rol admin ve todas las sucursales; cajero/farmacéutico solo la suya
sql/perfiles_email.sql     → agrega columna email a perfiles (para listar personal)
middleware.ts             → protege las rutas del dashboard sin sesión
```

## Identidad visual

Paleta "botica": verde pino (`pine`), ámbar de frasco antiguo (`amber`), papel cálido (`paper`) y rojo de alerta (`alert`) para vencimientos próximos y stock bajo. Tipografía: Fraunces (display), Inter (cuerpo), IBM Plex Mono (precios, lotes y códigos — como una etiqueta de receta).

## Hoja de ruta

1. ✅ Base: autenticación, layout, catálogo de productos y lotes
2. ✅ Ventas: punto de venta, descuento de stock por lote (FEFO), comprobante imprimible
3. ✅ Cobranza: ventas a crédito, pagos parciales, resumen de cuentas por cobrar
4. ✅ Compras: ingreso de mercadería, cada línea genera su propio lote
5. ✅ Reportes/Configuración: ventas y utilidad del mes, más vendidos, vencimientos, categorías y proveedores
6. ✅ Facturación electrónica SUNAT vía Nubefact (implementada — falta probar con tus credenciales reales)
7. ✅ Multi-sucursal: admin ve todas las sucursales (con selector), cajero/farmacéutico solo la suya

## Roles y personal

Hay 3 roles, cada uno con su propio "inicio" y menú lateral:

| Rol | Puede abrir | Pensado para |
|---|---|---|
| **admin** | Todo (Panel, Productos, Ventas, Cobranza, Compras, Reportes, Configuración) | El dueño/gerente |
| **farmacéutico** | Productos, Ventas, Cobranza | Quien atiende y también controla el stock |
| **cajero** | Ventas, Cobranza | Solo cobra, no ve reportes ni gestiona inventario |

Esto se aplica en dos capas, no solo escondiendo botones:
- `components/Sidebar.tsx` oculta del menú lo que el rol no puede usar.
- `lib/permisos.ts` (`requireRol`) se ejecuta al cargar cada página en el servidor y **redirige** si alguien entra directo a una URL que no le corresponde (ej. un cajero escribiendo `/reportes` a mano).
- Además, la base de datos (RLS) ya limita qué sucursal puede ver/modificar cada quien, así que aunque alguien manipulara la app, Supabase seguiría bloqueando el acceso a datos de otra sucursal.

### Cómo agregar a una persona de tu equipo

1. Entra como admin → **Configuración → Personal**.
2. Completa nombre, correo (será su usuario para iniciar sesión), una contraseña temporal, su rol y su sucursal.
3. Comunícale el correo y contraseña; puede cambiarla después desde Supabase Auth si quieres agregar un flujo de "olvidé mi contraseña" más adelante.
4. Si alguien deja de trabajar contigo, no lo elimines: dale click a **Desactivar** en esa misma tabla. Así conservas el historial de sus ventas, pero ya no puede iniciar sesión.

## Sobre la integración con Nubefact

Implementé el mapeo completo (`lib/nubefact.ts`) siguiendo la estructura estándar de su API JSON, pero **no pude probarlo en vivo** porque no tengo credenciales de tu cuenta. Antes de usarlo en producción:

1. Crea una cuenta de prueba en Nubefact y obtén tu RUTA y TOKEN de sandbox.
2. Completa `NUBEFACT_URL_SANDBOX` y `NUBEFACT_TOKEN` en `.env.local`.
3. Desde el ticket de una venta con tipo Boleta o Factura, usa el botón "Emitir electrónicamente" y revisa la respuesta guardada en `ventas.sunat_respuesta` si algo falla.
4. Verifica contra tu manual de integración (ayuda.nubefact.com) que los nombres de campo coincidan exactamente — Nubefact puede tener variaciones según el tipo de cuenta.
5. El correlativo (`numero`) se calcula contando comprobantes previos de la misma serie; si vas a emitir desde varias sucursales al mismo tiempo, conviene reemplazarlo por una tabla de correlativos con bloqueo (`for update`) para evitar duplicados.
