import { createClient } from "@/lib/supabase/server";
import { ListaCuentasPorCobrar } from "@/components/cobranzas/ListaCuentasPorCobrar";
import { requireRol } from "@/lib/auth-server";

async function getCuentas() {
  const supabase = createClient();
  const { data } = await supabase
    .from("vista_cuentas_por_cobrar")
    .select("*")
    .order("creado_en", { ascending: true });

  return (data ?? []).map((c: any) => ({
    ...c,
    total: Number(c.total),
    pagado: Number(c.pagado),
    saldo: Number(c.saldo),
  }));
}

export default async function CobranzasPage() {
  await requireRol(["admin", "farmaceutico", "cajero"]);

  const cuentas = await getCuentas();
  const totalPendiente = cuentas.reduce((a, c) => a + c.saldo, 0);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-pine-900">Cobranza</h1>
      <p className="mt-1 text-sm text-pine-700/70">Cuentas por cobrar de ventas al crédito</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-sm border border-sage-200 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-pine-700/60">Cuentas pendientes</p>
          <p className="mt-2 font-label text-3xl text-pine-900">{cuentas.length}</p>
        </div>
        <div className={`rounded-sm border bg-white p-5 ${totalPendiente > 0 ? "border-alert/30" : "border-sage-200"}`}>
          <p className="text-xs uppercase tracking-wide text-pine-700/60">Total por cobrar</p>
          <p className={`mt-2 font-label text-3xl ${totalPendiente > 0 ? "text-alert" : "text-pine-900"}`}>
            S/ {totalPendiente.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <ListaCuentasPorCobrar cuentas={cuentas} />
      </div>
    </div>
  );
}
