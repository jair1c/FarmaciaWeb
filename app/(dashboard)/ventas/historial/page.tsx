import { createClient } from "@/lib/supabase/server";
import { requireRol } from "@/lib/auth-server";
import { HistorialVentasTable } from "@/components/pos/HistorialVentasTable";
import Link from "next/link";

async function getVentas() {
  const supabase = createClient();
  const { data } = await supabase
    .from("ventas")
    .select("id, creado_en, tipo_comprobante, estado_pago, total, clientes(nombre)")
    .order("creado_en", { ascending: false })
    .limit(100);

  return (data ?? []).map((v: any) => ({
    id: v.id,
    creado_en: v.creado_en,
    tipo_comprobante: v.tipo_comprobante,
    estado_pago: v.estado_pago,
    total: Number(v.total),
    cliente_nombre: v.clientes?.nombre ?? "Cliente varios",
  }));
}

export default async function HistorialVentasPage() {
  await requireRol(["admin", "farmaceutico", "cajero"]);
  const ventas = await getVentas();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-pine-900">Historial de ventas</h1>
          <p className="mt-1 text-sm text-pine-700/70">Busca una venta para reimprimirla o registrar una devolución</p>
        </div>
        <Link
          href="/ventas"
          className="rounded-sm bg-pine-900 px-4 py-2 text-sm font-medium text-paper hover:bg-pine-700"
        >
          Nueva venta
        </Link>
      </div>

      <div className="mt-6">
        <HistorialVentasTable ventas={ventas} />
      </div>
    </div>
  );
}
