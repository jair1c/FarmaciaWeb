import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Rol = "admin" | "cajero" | "farmaceutico";

export type Perfil = {
  id: string;
  nombre: string;
  rol: Rol;
  sucursal_id: string | null;
  activo: boolean;
};

// Qué módulos puede abrir cada rol. Úsalo también para decidir qué
// mostrar en el Sidebar (components/Sidebar.tsx ya lo consume).
export const RUTAS_POR_ROL: Record<Rol, string[]> = {
  admin: ["dashboard", "productos", "ventas", "cobranzas", "compras", "reportes", "configuracion"],
  farmaceutico: ["productos", "ventas", "cobranzas"],
  cajero: ["ventas", "cobranzas"],
};

// A dónde mandar a alguien si intenta abrir una ruta que no le corresponde
export const INICIO_POR_ROL: Record<Rol, string> = {
  admin: "/dashboard",
  farmaceutico: "/ventas",
  cajero: "/ventas",
};

/**
 * Llamar al inicio de un Server Component de página para exigir que el
 * usuario tenga sesión y uno de los roles permitidos. Si no cumple,
 * redirige automáticamente (a /login o al inicio de su propio rol).
 */
export async function requireRol(rolesPermitidos: Rol[]): Promise<Perfil> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("id, nombre, rol, sucursal_id, activo")
    .eq("id", user.id)
    .single();

  if (!perfil) {
    // Usuario autenticado en Supabase Auth pero sin fila en `perfiles` todavía
    redirect("/login");
  }

  if (!perfil.activo) {
    redirect("/login");
  }

  if (!perfil.activo) {
    redirect("/login");
  }

  if (!rolesPermitidos.includes(perfil.rol as Rol)) {
    redirect(INICIO_POR_ROL[perfil.rol as Rol] ?? "/ventas");
  }

  return perfil as Perfil;
}

/** Trae el perfil del usuario actual sin exigir un rol específico (usado en el layout/Sidebar). */
export async function getPerfilActual(): Promise<Perfil | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("id, nombre, rol, sucursal_id, activo")
    .eq("id", user.id)
    .single();

  return (perfil as Perfil) ?? null;
}
