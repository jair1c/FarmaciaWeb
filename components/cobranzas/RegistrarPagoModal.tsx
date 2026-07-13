"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

type Cuenta = {
  venta_id: string;
  cliente_nombre: string | null;
  saldo: number;
};

export function RegistrarPagoModal({ cuenta, onCerrar }: { cuenta: Cuenta; onCerrar: () => void }) {
  const router = useRouter();
  const [monto, setMonto] = useState(cuenta.saldo.toFixed(2));
  const [metodoPago, setMetodoPago] = useState("EFECTIVO");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);

    const res = await fetch("/api/cobranzas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        venta_id: cuenta.venta_id,
        monto: Number(monto),
        metodo_pago: metodoPago,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "No se pudo registrar el pago");
      setEnviando(false);
      return;
    }

    router.refresh();
    onCerrar();
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-pine-950/40 p-4">
      <div className="w-full max-w-sm rounded-sm bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-pine-900">Registrar pago</h2>
          <button onClick={onCerrar} className="text-pine-700/50 hover:text-pine-900">
            <X size={18} />
          </button>
        </div>

        <p className="mb-4 text-sm text-pine-700/70">
          {cuenta.cliente_nombre ?? "Cliente varios"} · saldo pendiente{" "}
          <span className="font-label font-medium text-pine-900">S/ {cuenta.saldo.toFixed(2)}</span>
        </p>

        <form onSubmit={guardar} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-pine-700/60">
              Monto a pagar (S/)
            </label>
            <input
              required
              type="number"
              step="0.01"
              min="0.01"
              max={cuenta.saldo}
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="w-full rounded-sm border border-sage-200 px-3 py-2 text-sm outline-none focus:border-pine-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-pine-700/60">
              Método de pago
            </label>
            <select
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value)}
              className="w-full rounded-sm border border-sage-200 px-3 py-2 text-sm outline-none focus:border-pine-500"
            >
              <option value="EFECTIVO">Efectivo</option>
              <option value="TARJETA">Tarjeta</option>
              <option value="YAPE_PLIN">Yape / Plin</option>
              <option value="TRANSFERENCIA">Transferencia</option>
            </select>
          </div>

          {error && <p className="text-sm text-alert">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onCerrar}
              className="rounded-sm border border-sage-200 px-4 py-2 text-sm text-pine-900 hover:bg-sage-200/30"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="rounded-sm bg-pine-900 px-4 py-2 text-sm font-medium text-paper hover:bg-pine-700 disabled:opacity-50"
            >
              {enviando ? "Guardando..." : "Registrar pago"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
