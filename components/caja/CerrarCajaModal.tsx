"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

type Turno = {
  id: string;
  monto_apertura: number;
};

export function CerrarCajaModal({ turno, onCerrar }: { turno: Turno; onCerrar: () => void }) {
  const router = useRouter();
  const [montoContado, setMontoContado] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cerrado, setCerrado] = useState(false);

  async function cerrar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);

    const res = await fetch("/api/caja", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ turno_id: turno.id, monto_contado: Number(montoContado) }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      setEnviando(false);
      return;
    }

    setEnviando(false);
    setCerrado(true);
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-pine-950/40 p-4">
      <div className="w-full max-w-sm rounded-sm bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-pine-900">Cerrar caja</h2>
          <button onClick={onCerrar} className="text-pine-700/50 hover:text-pine-900">
            <X size={18} />
          </button>
        </div>

        {!cerrado ? (
          <form onSubmit={cerrar} className="space-y-4">
            <p className="text-sm text-pine-700/70">
              Cuenta el efectivo que tienes físicamente en caja ahora e ingrésalo. El sistema lo comparará
              contra lo que debería haber según tus ventas y cobros en efectivo del turno.
            </p>

            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-pine-700/60">
                Efectivo contado (S/)
              </label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={montoContado}
                onChange={(e) => setMontoContado(e.target.value)}
                className="w-full rounded-sm border border-sage-200 px-3 py-2 text-sm outline-none focus:border-pine-500"
              />
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
                {enviando ? "Cerrando..." : "Cerrar caja"}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center">
            <p className="text-sm text-pine-700/70">
              Caja cerrada correctamente. Revisa el detalle (esperado vs. contado) en la tabla de historial.
            </p>
            <button
              onClick={onCerrar}
              className="mt-4 rounded-sm bg-pine-900 px-4 py-2 text-sm font-medium text-paper hover:bg-pine-700"
            >
              Listo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
