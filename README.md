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
   10. `sql/fix_recursion_rls.sql` ⚠️ crítico — corrige un bug de recursión infinita en las políticas de `perfiles` que causaba el rebote intermitente al login
   11. `sql/caja_funciones.sql` (requiere que el paso 10 ya esté aplicado, usa su función `is_admin()`)
   12. `sql/devoluciones_funciones.sql` (requiere que el paso 11 ya esté aplicado, reemplaza `cerrar_caja()`)
   13. `sql/auditoria.sql` (requiere que el paso 10 ya esté aplicado, usa su función `is_admin()`)

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

## Subir a GitHub y desplegar en Vercel

El proyecto ya está listo para esto (incluye `.gitignore` y `package-lock.json`, y verifiqué que `npm run build` compila sin errores). Pasos:

1. Sube el proyecto a un repositorio de GitHub (si nunca lo hiciste desde tu máquina):
   ```bash
   git init
   git add .
   git commit -m "Primer commit"
   git branch -M main
   git remote add origin https://github.com/tu-usuario/tu-repo.git
   git push -u origin main
   ```
2. En [vercel.com](https://vercel.com), "Add New Project" → importa ese repositorio. Vercel detecta Next.js automáticamente, no necesitas configurar nada del build.
3. Antes de darle "Deploy", agrega las variables de entorno (Project Settings → Environment Variables) con los mismos valores de tu `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` ⚠️ marca esta como "Sensitive" — nunca debe quedar expuesta al navegador
   - `NUBEFACT_TOKEN`, `NUBEFACT_URL_SANDBOX`/`PRODUCCION`, `NUBEFACT_SERIE_BOLETA`, `NUBEFACT_SERIE_FACTURA` (cuando los tengas)
4. Deploy. Cada push a `main` vuelve a desplegar automáticamente.

**Si el build falla con "Your project's URL and API key are required to create a Supabase client"**: significa que faltan las variables de entorno en Vercel (o que se agregaron después del primer deploy — en ese caso hay que volver a desplegar desde la pestaña Deployments para que tomen efecto). La página `/login` ya está configurada para renderizarse dinámicamente en cada visita en vez de generarse como HTML estático en el build, así que una vez que las variables estén bien puestas, este error no debería volver a aparecer.

**Importante sobre `.env.local`:** ese archivo nunca se sube a GitHub (está en `.gitignore` a propósito, porque contiene tu service role key). En Vercel, las variables se configuran aparte, en el panel del proyecto — no dependen de que subas ese archivo.

## Nota de seguridad: Next.js

Este proyecto usa Next.js 14.2.35 (la última versión estable de la rama 14, sin la vulnerabilidad crítica que tenían versiones anteriores de 14.x). Sigue habiendo algunos avisos de `npm audit` relacionados con Next 14 en general que solo se resuelven saltando a Next 15/16 — esa migración implica cambios de código (en Next 15+, `cookies()` y `headers()` pasan a ser asíncronos), así que no la hice automáticamente para no romper nada sin que lo pruebes primero. Cuando quieras dar ese salto, dímelo y lo hacemos con cuidado.

## Estructura del proyecto

```
app/
  login/                 → inicio de sesión (page.tsx fuerza renderizado dinámico; el formulario vive en components/LoginForm.tsx)
  (dashboard)/            → rutas protegidas (requieren sesión)
    dashboard/            → panel con métricas del día
    productos/             → catálogo + lotes + vencimientos
    ventas/                → punto de venta: búsqueda, carrito y checkout
    ventas/historial/      → buscar ventas pasadas (reimprimir, devolver)
    ventas/[id]/ticket/    → comprobante imprimible + devoluciones/anulación
    caja/                  → apertura/cierre de caja e historial de turnos
    cobranzas/             → cuentas por cobrar y registro de pagos
    compras/               → registro de compras (genera lotes automáticamente)
    reportes/              → ventas del mes, utilidad, más vendidos, vencimientos
    configuracion/         → categorías, proveedores, sucursales y personal (solo admin)
    auditoria/             → historial de cambios en productos y personal (solo admin)
  api/facturacion/        → integración con Nubefact
  api/ventas/             → registra una venta llamando a la función crear_venta
  api/caja/               → abre (POST) y cierra (PATCH) turnos de caja
  api/devoluciones/       → registra una devolución/anulación (solo admin)
  api/cobranzas/          → registra un pago llamando a la función registrar_pago
  api/compras/            → registra una compra llamando a la función crear_compra
  api/categorias/         → crear/eliminar categorías
  api/proveedores/        → crear/eliminar proveedores
  api/sucursales/         → crear sucursales (solo admin)
  api/usuarios/           → crear personal (Auth + perfil) y activar/desactivar (solo admin)
components/               → Sidebar (filtrado por rol), LoteBadge, CerrarSesionButton, SelectorSucursal
components/pos/            → VentaPOS (carrito), BotonImprimir, EmitirSunatButton, DevolucionButton, HistorialVentasTable
components/caja/           → AbrirCajaForm, EstadoCajaAbierta, CerrarCajaModal
components/productos/      → NuevoProductoModal
components/cobranzas/      → ListaCuentasPorCobrar, RegistrarPagoModal
components/compras/        → NuevaCompraModal
components/configuracion/  → CategoriasPanel, ProveedoresPanel, SucursalesPanel, UsuariosPanel
components/auditoria/      → AuditoriaTable (comparador legible de qué cambió)
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
sql/fix_recursion_rls.sql  → corrige recursión infinita en políticas de perfiles (función is_admin())
sql/caja_funciones.sql     → control de caja: tabla turnos_caja, políticas RLS y funciones abrir_caja/cerrar_caja
sql/devoluciones_funciones.sql → devoluciones/anulaciones: regresa stock al lote original, actualiza cerrar_caja
sql/auditoria.sql          → registro de cambios por trigger en productos y perfiles (no depende de la app)
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
8. ✅ Control de caja: apertura/cierre de turno con cálculo automático de efectivo esperado vs. contado
9. ✅ Devoluciones/anulaciones: por línea y cantidad parcial, con reingreso de stock al lote original
10. ✅ Auditoría de cambios: quién editó qué y cuándo, en productos y personal

## Sobre Auditoría

A diferencia del resto de módulos, este **no depende de que la app reporte los cambios** — usa triggers de Postgres, así que registra un cambio sin importar si se hizo desde el sistema o directamente en el editor de tablas de Supabase (algo que la mayoría de sistemas de auditoría "desde la aplicación" no pueden garantizar).

Por ahora cubre **productos** (crear/editar/eliminar — sobre todo cambios de precio) y **personal** (cambios de rol o activar/desactivar). Deliberadamente no metí `lotes` ni `ventas` en la auditoría genérica: cada venta genera automáticamente varios cambios en `lotes` (el descuento de stock), así que hubiera inundado el registro con ruido sin aportar mucho — ya tienes trazabilidad de eso a través de `venta_detalle` y `devoluciones`.

Si más adelante quieres auditar otra tabla (por ejemplo, cambios de precio en `compras` o ediciones en `clientes`), es una sola línea SQL agregar el trigger — avísame.


## Sobre Devoluciones / Anulaciones

Solo un **admin** puede registrarlas (afecta stock, caja y potencialmente los reportes de utilidad, así que lo dejé restringido). Desde **Ventas → Ver historial** buscas la venta por cliente, entras a su ticket, y ahí aparece el botón "Devolver / anular" si todavía queda algo disponible para devolver.

Puedes devolver **líneas específicas con cantidades parciales** (ej. el cliente compró 3 cajas y devuelve 1), o usar "Devolver todo lo disponible" para anular la venta completa de un clic. El stock siempre regresa al **mismo lote** del que salió — así el historial de vencimientos no se distorsiona. Si se devuelve el 100% de lo vendido, la venta pasa automáticamente a estado "Anulado".

**Una simplificación que hice a propósito:** el cálculo de caja asume que una devolución se paga con el mismo método que la venta original (si la venta fue en efectivo, la devolución resta de la caja en efectivo). Si en la práctica sueles devolver dinero por un medio distinto al de la venta original (por ejemplo, cobraste con Yape pero devuelves en efectivo), el cálculo del cierre de caja no lo reflejaría correctamente — avísame si esto te pasa seguido y lo ajustamos.

Lo que **no** hice, a propósito, por quedar fuera del alcance actual: comunicar la devolución a SUNAT (una nota de crédito electrónica es un documento aparte que Nubefact también soporta, pero es una integración distinta a la que ya hicimos).


## Sobre Control de Caja

Cómo funciona: al empezar el turno, cualquier rol operativo (cajero, farmacéutico o admin) abre la caja indicando el efectivo con el que arranca. El sistema no vuelve a pedir nada hasta el cierre — en ese momento, calcula automáticamente cuánto efectivo *debería* haber (monto de apertura + ventas en efectivo + cobros en efectivo registrados durante ese turno) y lo compara contra lo que la persona cuenta físicamente. La diferencia queda guardada en el historial, sin importar si es positiva o negativa.

Cosas a tener en cuenta:
- Solo puede haber **una caja abierta por sucursal a la vez** — si alguien intenta abrir otra sin cerrar la anterior, el sistema se lo impide.
- El cálculo del efectivo esperado **no distingue turnos que se solapan entre cajeros distintos en la misma sucursal** — si tu operación tiene más de un cajero atendiendo simultáneamente en el mismo punto, todos comparten el mismo turno de caja (lo cual generalmente es lo correcto: una caja física, un turno).
- No hay todavía forma de registrar **egresos de caja** (por ejemplo, si sacas dinero para comprar algo con la caja chica) — el efectivo esperado asume que nada sale de la caja aparte de lo que ya se contempla. Si lo necesitas, es una extensión sencilla: una tabla `movimientos_caja` con montos positivos/negativos.


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

## Solución de problemas

**"Entro y a los milisegundos/segundos me regresa a /login" (RESUELTO):** la causa raíz era una **recursión infinita en las políticas RLS de `perfiles`** — la política que permitía a un admin ver todo el personal se consultaba a sí misma dentro de su propia condición (`EXISTS (SELECT ... FROM perfiles ...)`), causando que Postgres devolviera el error `infinite recursion detected in policy for relation "perfiles"` de forma intermitente (dependía del plan de consulta que eligiera Postgres en cada momento, por eso a veces funcionaba y a veces no). `sql/fix_recursion_rls.sql` lo corrige moviendo esa verificación a una función `is_admin()` con `security definer`, que al ejecutarse con permisos elevados no vuelve a disparar la misma política. **Este archivo es obligatorio, ejecútalo si no lo has hecho.**

Si en el futuro aparece un problema similar (rebote a login sin razón aparente), el orden de diagnóstico que nos funcionó fue:
1. Revisar los **Runtime Logs de Vercel** (pestaña Logs) en el momento exacto del rebote, haciendo clic en la petición específica para ver su detalle expandido — no solo la vista de lista.
2. Buscar mensajes de error de Postgres/Supabase ahí (como el de recursión infinita), no solo en la consola del navegador — los `redirect()` de Next.js no generan errores visibles en el navegador.
3. Verificar que el `id` en `perfiles` coincida exactamente con el de `auth.users`, que `activo = true` y que `rol` sea válido.
4. Verificar que `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY` en Vercel coincidan con el proyecto de Supabase correcto.


