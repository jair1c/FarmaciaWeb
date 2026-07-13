"use client";

import { useState } from "react";
import { RegistrarPagoModal } from "./RegistrarPagoModal";

type Cuenta = {
  venta_id: string;
  cliente_nombre: string | null;
  numero_documento: string | null;
  telefono: string | null;
  total: number;
  pagado: number;
  saldo: number;
  estado_pago: string;
  creado_en: string;
};

export function ListaCuentasPorCobrar({ cuentas }: { cuentas: Cuenta[] }) {
  const [seleccionada, setSeleccionada] = useState<Cuenta | null>(null);

  return (
    <>
      <div className="overflow-hidden rounded-sm border border-sage-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-sage-200 bg-sage-200/30 text-xs uppercase tracking-wide text-pine-700/70">
            <tr>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Pagado</th>
              <th className="px-4 py-3">Saldo</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {cuentas.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-pine-700/50">
                  No hay cuentas por cobrar pendientes. Todas las ventas al crédito están al día.
                </td>
              </tr>
            )}
            {cuentas.map((c) => (
              <tr key={c.venta_id} className="border-b border-sage-200 last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium text-pine-900">{c.cliente_nombre ?? "Cliente varios"}</p>
                  {c.telefono && <p className="text-xs text-pine-700/50">{c.telefono}</p>}
                </td>
                <td className="px-4 py-3 text-pine-700/70">
                  {new Date(c.creado_en).toLocaleDateString("es-PE")}
                </td>
                <td className="px-4 py-3 font-label">S/ {c.total.toFixed(2)}</td>
                <td className="px-4 py-3 font-label text-pine-700/70">S/ {c.pagado.toFixed(2)}</td>
                <td className="px-4 py-3 font-label font-medium text-alert">S/ {c.saldo.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className="label-chip">
                    {c.estado_pago === "PARCIAL" ? "Pago parcial" : "Al crédito"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setSeleccionada(c)}
                    className="rounded-sm bg-pine-900 px-3 py-1.5 text-xs font-medium text-paper hover:bg-pine-700"
                  >
                    Registrar pago
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {seleccionada && (
        <RegistrarPagoModal cuenta={seleccionada} onCerrar={() => setSeleccionada(null)} />
      )}
    </>
  );
}
