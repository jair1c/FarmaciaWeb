"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Pill,
  ShoppingCart,
  Wallet,
  Truck,
  BarChart3,
  Settings,
  Banknote,
} from "lucide-react";
import { RUTAS_POR_ROL, type Rol } from "@/lib/permisos";
import { CerrarSesionButton } from "@/components/CerrarSesionButton";

const items = [
  { href: "/dashboard", ruta: "dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/productos", ruta: "productos", label: "Productos y lotes", icon: Pill },
  { href: "/ventas", ruta: "ventas", label: "Ventas", icon: ShoppingCart },
  { href: "/caja", ruta: "caja", label: "Caja", icon: Banknote },
  { href: "/cobranzas", ruta: "cobranzas", label: "Cobranza", icon: Wallet },
  { href: "/compras", ruta: "compras", label: "Compras", icon: Truck },
  { href: "/reportes", ruta: "reportes", label: "Reportes", icon: BarChart3 },
  { href: "/configuracion", ruta: "configuracion", label: "Configuración", icon: Settings },
];

const ETIQUETA_ROL: Record<Rol, string> = {
  admin: "Administrador",
  farmaceutico: "Farmacéutico",
  cajero: "Cajero",
};

export function Sidebar({ rol, nombre }: { rol: Rol; nombre?: string }) {
  const pathname = usePathname();
  const permitidas = RUTAS_POR_ROL[rol] ?? [];
  const itemsVisibles = items.filter((i) => permitidas.includes(i.ruta));

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-sage-200 bg-pine-950 text-paper">
      <div className="border-b border-white/10 px-5 py-5">
        <span className="label-chip !border-amber-500/30 !bg-transparent !text-amber-500">
          Rx
        </span>
        <p className="mt-2 font-display text-lg font-semibold">Farmacia</p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {itemsVisibles.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 rounded-sm px-3 py-2 text-sm transition ${
                active
                  ? "bg-white/10 text-paper"
                  : "text-paper/60 hover:bg-white/5 hover:text-paper"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-5 py-4">
        {nombre && <p className="text-sm text-paper">{nombre}</p>}
        <p className="text-xs text-paper/50">{ETIQUETA_ROL[rol]}</p>
        <CerrarSesionButton />
      </div>
    </aside>
  );
}
