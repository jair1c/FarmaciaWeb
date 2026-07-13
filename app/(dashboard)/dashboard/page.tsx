import { createClient } from "@/lib/supabase/server";

async function getMetricas() {
  const supabase = createClient();

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const [{ count: ventasHoy }, { data: ventasHoyData }, { count: lotesPorVencer }] =
    await Promise.all([
      supabase.from("ventas").select("*", { count: "exact", head: true }).gte("creado_en", hoy.toISOString()),
      supabase.from("ventas").select("total").gte("creado_en", hoy.toISOString()),
      supabase
        .from("lotes")
        .select("*", { count: "exact", head: true })
        .lte("fecha_vencimiento", new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString())
        .gt("cantidad_actual", 0),
    ]);

  const totalHoy = ventasHoyData?.reduce((acc, v) => acc + Number(v.total), 0) ?? 0;

  return {
    ventasHoy: ventasHoy ?? 0,
    totalHoy,
    lotesPorVencer: lotesPorVencer ?? 0,
  };
}

export default async function DashboardPage() {
  const { ventasHoy, totalHoy, lotesPorVencer } = await getMetricas();

  const tarjetas = [
    { label: "Ventas hoy", valor: ventasHoy.toString() },
    { label: "Ingresos hoy", valor: `S/ ${totalHoy.toFixed(2)}` },
    { label: "Lotes por vencer (60d)", valor: lotesPorVencer.toString(), alerta: lotesPorVencer > 0 },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-pine-900">Panel</h1>
      <p className="mt-1 text-sm text-pine-700/70">Resumen del día en tu farmacia</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {tarjetas.map((t) => (
          <div
            key={t.label}
            className={`rounded-sm border bg-white p-5 ${
              t.alerta ? "border-alert/30" : "border-sage-200"
            }`}
          >
            <p className="text-xs uppercase tracking-wide text-pine-700/60">{t.label}</p>
            <p className={`mt-2 font-label text-3xl ${t.alerta ? "text-alert" : "text-pine-900"}`}>
              {t.valor}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
