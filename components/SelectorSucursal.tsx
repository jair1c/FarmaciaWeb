"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

type Sucursal = { id: string; nombre: string };

export function SelectorSucursal({ sucursales }: { sucursales: Sucursal[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const actual = searchParams.get("sucursal") ?? "";

  if (sucursales.length <= 1) return null;

  function cambiar(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (id) {
      params.set("sucursal", id);
    } else {
      params.delete("sucursal");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      value={actual}
      onChange={(e) => cambiar(e.target.value)}
      className="rounded-sm border border-sage-200 bg-white px-3 py-2 text-sm outline-none focus:border-pine-500"
    >
      <option value="">Todas las sucursales</option>
      {sucursales.map((s) => (
        <option key={s.id} value={s.id}>
          {s.nombre}
        </option>
      ))}
    </select>
  );
}
