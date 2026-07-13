import { createClient } from "@/lib/supabase/server";
import { CategoriasPanel } from "@/components/configuracion/CategoriasPanel";
import { ProveedoresPanel } from "@/components/configuracion/ProveedoresPanel";

async function getDatos() {
  const supabase = createClient();
  const [{ data: categorias }, { data: proveedores }] = await Promise.all([
    supabase.from("categorias").select("id, nombre").order("nombre"),
    supabase.from("proveedores").select("id, nombre, ruc, telefono, contacto").order("nombre"),
  ]);
  return { categorias: categorias ?? [], proveedores: proveedores ?? [] };
}

export default async function ConfiguracionPage() {
  const { categorias, proveedores } = await getDatos();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-pine-900">Configuración</h1>
      <p className="mt-1 text-sm text-pine-700/70">Catálogos de apoyo para el resto del sistema</p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CategoriasPanel categorias={categorias} />
        <ProveedoresPanel proveedores={proveedores} />
      </div>
    </div>
  );
}
