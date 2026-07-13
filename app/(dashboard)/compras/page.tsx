import { createClient } from "@/lib/supabase/server";
import { NuevaCompraModal } from "@/components/compras/NuevaCompraModal";

async function getDatos() {
  const supabase = createClient();

  const [{ data: compras }, { data: productos }, { data: proveedores }] = await Promise.all([
    supabase
      .from("compras")
      .select("id, numero_documento, total, creado_en, proveedores(nombre), compra_detalle(cantidad)")
      .order("creado_en", { ascending: false }),
    supabase.from("productos").select("id, nombre").eq("activo", true).order("nombre"),
    supabase.from("proveedores").select("id, nombre").order("nombre"),
  ]);

  return { compras: compras ?? [], productos: productos ?? [], proveedores: proveedores ?? [] };
}

export default async function ComprasPage() {
  const { compras, productos, proveedores } = await getDatos();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-pine-900">Compras</h1>
          <p className="mt-1 text-sm text-pine-700/70">Ingreso de mercadería — cada línea crea su propio lote</p>
        </div>
        <NuevaCompraModal productos={productos} proveedores={proveedores} />
      </div>

      <div className="mt-6 overflow-hidden rounded-sm border border-sage-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-sage-200 bg-sage-200/30 text-xs uppercase tracking-wide text-pine-700/70">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Proveedor</th>
              <th className="px-4 py-3">Documento</th>
              <th className="px-4 py-3">Líneas</th>
              <th className="px-4 py-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {compras.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-pine-700/50">
                  Todavía no registras compras. La primera dejará listo el stock inicial de tus productos.
                </td>
              </tr>
            )}
            {compras.map((c: any) => (
              <tr key={c.id} className="border-b border-sage-200 last:border-0">
                <td className="px-4 py-3 text-pine-700/70">
                  {new Date(c.creado_en).toLocaleDateString("es-PE")}
                </td>
                <td className="px-4 py-3 font-medium text-pine-900">
                  {c.proveedores?.nombre ?? "Sin proveedor"}
                </td>
                <td className="px-4 py-3 text-pine-700/70">{c.numero_documento ?? "—"}</td>
                <td className="px-4 py-3 font-label">{c.compra_detalle?.length ?? 0}</td>
                <td className="px-4 py-3 font-label">S/ {Number(c.total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
