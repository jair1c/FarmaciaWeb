import { createClient } from "@/lib/supabase/server";
import { CategoriasPanel } from "@/components/configuracion/CategoriasPanel";
import { ProveedoresPanel } from "@/components/configuracion/ProveedoresPanel";
import { SucursalesPanel } from "@/components/configuracion/SucursalesPanel";
import { UsuariosPanel } from "@/components/configuracion/UsuariosPanel";
import { requireRol } from "@/lib/auth-server";

async function getDatos() {
  const supabase = createClient();
  const [{ data: categorias }, { data: proveedores }, { data: sucursales }, { data: usuarios }] = await Promise.all([
    supabase.from("categorias").select("id, nombre").order("nombre"),
    supabase.from("proveedores").select("id, nombre, ruc, telefono, contacto").order("nombre"),
    supabase.from("sucursales").select("id, nombre, direccion, ruc").order("nombre"),
    supabase.from("perfiles").select("id, nombre, email, rol, sucursal_id, activo").order("nombre"),
  ]);
  return {
    categorias: categorias ?? [],
    proveedores: proveedores ?? [],
    sucursales: sucursales ?? [],
    usuarios: usuarios ?? [],
  };
}

export default async function ConfiguracionPage() {
  const perfil = await requireRol(["admin"]);
  const { categorias, proveedores, sucursales, usuarios } = await getDatos();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-pine-900">Configuración</h1>
      <p className="mt-1 text-sm text-pine-700/70">Catálogos de apoyo, sucursales y personal</p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <UsuariosPanel usuarios={usuarios} sucursales={sucursales} usuarioActualId={perfil.id} />
        <SucursalesPanel sucursales={sucursales} />
        <CategoriasPanel categorias={categorias} />
        <ProveedoresPanel proveedores={proveedores} />
      </div>
    </div>
  );
}
