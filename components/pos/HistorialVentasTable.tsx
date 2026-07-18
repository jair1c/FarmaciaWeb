"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

type Venta = {
  id: string;
  creado_en: string;
  tipo_comprobante: string;
  estado_pago: string;
  total: number;
  cliente_nombre: string;
};

const ETIQUETA_ESTADO: Record<string, string> = {
  PAGADO: "Pagado",
  CREDITO: "Al crédito",
  PARCIAL: "Pago parcial",
  ANULADO: "Anulado",
};

export function HistorialVentasTable({ ventas }: { ventas: Venta[] }) {
  const [busqueda, setBusqueda] = useState("");

  const filtradas = useMemo(() => {
    if (!busqueda.trim()) return ventas;
    const q = busqueda.toLowerCase();
    return ventas.filter((v) => v.cliente_nombre.toLowerCase().includes(q));
  }, [busqueda, ventas]);

  return (
    <div>
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-pine-700/50" />
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por cliente..."
          className="w-full rounded-sm border border-sage-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-pine-500 focus:ring-1 focus:ring-pine-500"
        />
      </div>

      <div className="mt-4 overflow-hidden rounded-sm border border-sage-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-sage-200 bg-sage-200/30 text-xs uppercase tracking-wide text-pine-700/70">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Comprobante</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-pine-700/50">
                  No se encontraron ventas.
                </td>
              </tr>
            )}
            {filtradas.map((v) => (
              <tr key={v.id} className="border-b border-sage-200 last:border-0 hover:bg-sage-200/10">
                <td className="px-4 py-3">
                  <Link href={`/ventas/${v.id}/ticket`} className="block text-pine-700/70 hover:underline">
                    {new Date(v.creado_en).toLocaleString("es-PE")}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/ventas/${v.id}/ticket`} className="block text-pine-900 hover:underline">
                    {v.cliente_nombre}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/ventas/${v.id}/ticket`} className="block text-pine-700/70">
                    {v.tipo_comprobante}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/ventas/${v.id}/ticket`} className="block font-label text-pine-900">
                    S/ {v.total.toFixed(2)}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/ventas/${v.id}/ticket`}>
                    <span
                      className={`label-chip ${v.estado_pago === "ANULADO" ? "label-chip--alerta" : ""}`}
                    >
                      {ETIQUETA_ESTADO[v.estado_pago] ?? v.estado_pago}
                    </span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
