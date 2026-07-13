import { createClient } from "@/lib/supabase/server";
import { LoteBadge } from "@/components/LoteBadge";
import { NuevoProductoModal } from "@/components/productos/NuevoProductoModal";
import { requireRol } from "@/lib/permisos";

async function getProductos() {
  const supabase = createClient();
  const { data } = await supabase
    .from("productos")
    .select("id, nombre, precio_venta, stock_minimo, lotes(id, numero_lote, fecha_vencimiento, cantidad_actual)")
    .eq("activo", true)
    .order("nombre");

  return data ?? [];
}

async function getCategorias() {
  const supabase = createClient();
  const { data } = await supabase.from("categorias").select("id, nombre").order("nombre");
  return data ?? [];
}

export default async function ProductosPage() {
  await requireRol(["admin", "farmaceutico"]);

  const [productos, categorias] = await Promise.all([getProductos(), getCategorias()]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-pine-900">Productos y lotes</h1>
          <p className="mt-1 text-sm text-pine-700/70">Catálogo e inventario por lote</p>
        </div>
        <NuevoProductoModal categorias={categorias} />
      </div>

      <div className="mt-6 overflow-hidden rounded-sm border border-sage-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-sage-200 bg-sage-200/30 text-xs uppercase tracking-wide text-pine-700/70">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Stock total</th>
              <th className="px-4 py-3">Lotes</th>
            </tr>
          </thead>
          <tbody>
            {productos.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-pine-700/50">
                  Todavía no hay productos registrados. Empieza agregando el primero.
                </td>
              </tr>
            )}
            {productos.map((p: any) => {
              const stockTotal = p.lotes?.reduce((a: number, l: any) => a + l.cantidad_actual, 0) ?? 0;
              return (
                <tr key={p.id} className="border-b border-sage-200 last:border-0">
                  <td className="px-4 py-3 font-medium text-pine-900">{p.nombre}</td>
                  <td className="px-4 py-3 font-label">S/ {Number(p.precio_venta).toFixed(2)}</td>
                  <td className={`px-4 py-3 font-label ${stockTotal <= p.stock_minimo ? "text-alert" : ""}`}>
                    {stockTotal}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {p.lotes?.map((l: any) => (
                        <LoteBadge key={l.id} numeroLote={l.numero_lote} fechaVencimiento={l.fecha_vencimiento} />
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
