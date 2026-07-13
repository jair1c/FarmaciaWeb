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
} from "lucide-react";

const items = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/productos", label: "Productos y lotes", icon: Pill },
  { href: "/ventas", label: "Ventas", icon: ShoppingCart },
  { href: "/cobranzas", label: "Cobranza", icon: Wallet },
  { href: "/compras", label: "Compras", icon: Truck },
  { href: "/reportes", label: "Reportes", icon: BarChart3 },
  { href: "/configuracion", label: "Configuración", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-56 flex-col border-r border-sage-200 bg-pine-950 text-paper">
      <div className="border-b border-white/10 px-5 py-5">
        <span className="label-chip !border-amber-500/30 !bg-transparent !text-amber-500">
          Rx
        </span>
        <p className="mt-2 font-display text-lg font-semibold">Farmacia</p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {items.map(({ href, label, icon: Icon }) => {
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
    </aside>
  );
}
