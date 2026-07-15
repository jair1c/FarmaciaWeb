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
// Este archivo NO importa nada de servidor (next/headers, etc.) a propósito,
// porque también lo usan componentes cliente como el Sidebar.
export const RUTAS_POR_ROL: Record<Rol, string[]> = {
  admin: ["dashboard", "productos", "ventas", "caja", "cobranzas", "compras", "reportes", "configuracion"],
  farmaceutico: ["productos", "ventas", "caja", "cobranzas"],
  cajero: ["ventas", "caja", "cobranzas"],
};

// A dónde mandar a alguien si intenta abrir una ruta que no le corresponde
export const INICIO_POR_ROL: Record<Rol, string> = {
  admin: "/dashboard",
  farmaceutico: "/ventas",
  cajero: "/ventas",
};
