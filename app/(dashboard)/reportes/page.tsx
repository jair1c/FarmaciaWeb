import { createClient } from "@/lib/supabase/server";
import { LoteBadge } from "@/components/LoteBadge";

async function getReporte() {
  const supabase = createClient();

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const en60dias = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: detalleMes }, { data: lotesPorVencer }] = await Promise.all([
    supabase
      .from("vista_reporte_ventas")
      .select("*")
      .gte("creado_en", inicioMes.toISOString()),
    supabase
      .from("lotes")
      .select("id, numero_lote, fecha_vencimiento, cantidad_actual, productos(nombre)")
      .lte("fecha_vencimiento", en60dias)
      .gt("cantidad_actual", 0)
      .order("fecha_vencimiento", { ascending: true }),
  ]);

  const filas = detalleMes ?? [];

  const ingresoMes = filas.reduce((a, f) => a + Number(f.ingreso), 0);
  const utilidadMes = filas.reduce((a, f) => a + Number(f.utilidad), 0);

  const porProducto = new Map<string, { nombre: string; cantidad: number; ingreso: number }>();
  for (const f of filas) {
    const actual = porProducto.get(f.producto_id) ?? { nombre: f.producto_nombre, cantidad: 0, ingreso: 0 };
    actual.cantidad += f.cantidad;
    actual.ingreso += Number(f.ingreso);
    porProducto.set(f.producto_id, actual);
  }
  const masVendidos = [...porProducto.values()].sort((a, b) => b.cantidad - a.cantidad).slice(0, 5);

  return {
    ingresoMes,
    utilidadMes,
    masVendidos,
    lotesPorVencer: lotesPorVencer ?? [],
  };
}

export default async function ReportesPage() {
  const { ingresoMes, utilidadMes, masVendidos, lotesPorVencer } = await getReporte();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-pine-900">Reportes</h1>
      <p className="mt-1 text-sm text-pine-700/70">Resumen del mes en curso</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-sm border border-sage-200 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-pine-700/60">Ingresos del mes</p>
          <p className="mt-2 font-label text-3xl text-pine-900">S/ {ingresoMes.toFixed(2)}</p>
        </div>
        <div className="rounded-sm border border-sage-200 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-pine-700/60">Utilidad estimada del mes</p>
          <p className="mt-2 font-label text-3xl text-pine-900">S/ {utilidadMes.toFixed(2)}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-sm border border-sage-200 bg-white p-5">
          <h2 className="font-display text-lg font-semibold text-pine-900">Productos más vendidos</h2>
          <p className="mt-0.5 text-sm text-pine-700/70">Este mes, por cantidad</p>

          <ul className="mt-4 divide-y divide-sage-200">
            {masVendidos.length === 0 && (
              <li className="py-3 text-sm text-pine-700/50">Todavía no hay ventas este mes.</li>
            )}
            {masVendidos.map((p) => (
              <li key={p.nombre} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-pine-900">{p.nombre}</span>
                <span className="font-label text-pine-700/70">
                  {p.cantidad} und · S/ {p.ingreso.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-sm border border-sage-200 bg-white p-5">
          <h2 className="font-display text-lg font-semibold text-pine-900">Lotes por vencer</h2>
          <p className="mt-0.5 text-sm text-pine-700/70">Próximos 60 días</p>

          <ul className="mt-4 divide-y divide-sage-200">
            {lotesPorVencer.length === 0 && (
              <li className="py-3 text-sm text-pine-700/50">No hay lotes por vencer en este periodo.</li>
            )}
            {lotesPorVencer.map((l: any) => (
              <li key={l.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-pine-900">{l.productos?.nombre}</span>
                <div className="flex items-center gap-2">
                  <span className="font-label text-pine-700/70">{l.cantidad_actual} und</span>
                  <LoteBadge numeroLote={l.numero_lote} fechaVencimiento={l.fecha_vencimiento} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
