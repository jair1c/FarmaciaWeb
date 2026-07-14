import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { INICIO_POR_ROL, type Perfil, type Rol } from "@/lib/permisos";

/**
 * Llamar al inicio de un Server Component de página para exigir que el
 * usuario tenga sesión y uno de los roles permitidos. Si no cumple,
 * redirige automáticamente (a /login o al inicio de su propio rol).
 *
 * Solo se puede importar desde Server Components / route handlers,
 * nunca desde un componente con "use client" (usa next/headers).
 */
export async function requireRol(rolesPermitidos: Rol[]): Promise<Perfil> {
  const supabase = createClient();

  const {
    data: { user },
    error: errorUsuario,
  } = await supabase.auth.getUser();

  if (!user) {
    console.log("[requireRol] sin usuario en la sesión.", errorUsuario?.message ?? "(sin error explícito)");
    redirect("/login");
  }

  const { data: perfil, error: errorPerfil } = await supabase
    .from("perfiles")
    .select("id, nombre, rol, sucursal_id, activo")
    .eq("id", user.id)
    .single();

  if (!perfil) {
    console.log(
      "[requireRol] usuario autenticado pero sin perfil encontrado. user.id =",
      user.id,
      "error:",
      errorPerfil?.message ?? "(sin error explícito, 0 filas)"
    );
    redirect("/login");
  }

  if (!perfil.activo) {
    console.log("[requireRol] perfil encontrado pero inactivo. user.id =", user.id);
    redirect("/login");
  }

  if (!rolesPermitidos.includes(perfil.rol as Rol)) {
    console.log(
      "[requireRol] rol no autorizado para esta ruta. rol =",
      perfil.rol,
      "permitidos =",
      rolesPermitidos
    );
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
