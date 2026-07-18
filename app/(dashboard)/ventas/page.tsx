import { createClient } from "@/lib/supabase/server";
import { VentaPOS } from "@/components/pos/VentaPOS";
import { requireRol } from "@/lib/auth-server";
import Link from "next/link";

async function getDatos() {
  const supabase = createClient();

  const [{ data: productos }, { data: clientes }] = await Promise.all([
    supabase
      .from("productos")
      .select("id, nombre, precio_venta, codigo_barras, lotes(cantidad_actual)")
      .eq("activo", true)
      .order("nombre"),
    supabase.from("clientes").select("id, nombre, numero_documento").order("nombre"),
  ]);

  const productosConStock = (productos ?? []).map((p: any) => ({
    id: p.id,
    nombre: p.nombre,
    precio_venta: Number(p.precio_venta),
    codigo_barras: p.codigo_barras,
    stock: p.lotes?.reduce((a: number, l: any) => a + l.cantidad_actual, 0) ?? 0,
  }));

  return { productos: productosConStock, clientes: clientes ?? [] };
}

export default async function VentasPage() {
  await requireRol(["admin", "farmaceutico", "cajero"]);

  const { productos, clientes } = await getDatos();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-pine-900">Nueva venta</h1>
          <p className="mt-1 text-sm text-pine-700/70">Busca por nombre o código de barras y agrega al carrito</p>
        </div>
        <Link href="/ventas/historial" className="text-sm text-pine-700 hover:underline">
          Ver historial →
        </Link>
      </div>

      <div className="mt-6">
        <VentaPOS productos={productos} clientes={clientes} />
      </div>
    </div>
  );
}
