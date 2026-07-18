"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

type Linea = {
  venta_detalle_id: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  disponible: number;
};

export function DevolucionButton({ ventaId, lineas }: { ventaId: string; lineas: Linea[] }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [cantidades, setCantidades] = useState<Record<string, string>>({});
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function actualizar(id: string, valor: string) {
    setCantidades((prev) => ({ ...prev, [id]: valor }));
  }

  function devolverTodo() {
    const nuevas: Record<string, string> = {};
    for (const l of lineas) {
      if (l.disponible > 0) nuevas[l.venta_detalle_id] = String(l.disponible);
    }
    setCantidades(nuevas);
  }

  const total = lineas.reduce((a, l) => {
    const cant = Number(cantidades[l.venta_detalle_id] || 0);
    return a + cant * l.precio_unitario;
  }, 0);

  async function confirmar(e: React.FormEvent) {
    e.preventDefault();

    const items = lineas
      .map((l) => ({ venta_detalle_id: l.venta_detalle_id, cantidad: Number(cantidades[l.venta_detalle_id] || 0) }))
      .filter((i) => i.cantidad > 0);

    if (items.length === 0) {
      setError("Indica al menos una cantidad a devolver");
      return;
    }

    setEnviando(true);
    setError(null);

    const res = await fetch("/api/devoluciones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ venta_id: ventaId, items, motivo: motivo || null }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      setEnviando(false);
      return;
    }

    setEnviando(false);
    setAbierto(false);
    setCantidades({});
    setMotivo("");
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="w-full rounded-sm border border-alert/40 py-2 text-xs font-medium text-alert hover:bg-alert/5"
      >
        Devolver / anular
      </button>

      {abierto && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-pine-950/40 p-4">
          <div className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-sm bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-pine-900">Registrar devolución</h2>
              <button onClick={() => setAbierto(false)} className="text-pine-700/50 hover:text-pine-900">
                <X size={18} />
              </button>
            </div>

            <button
              type="button"
              onClick={devolverTodo}
              className="mb-3 text-xs text-pine-700 hover:underline"
            >
              Devolver todo lo disponible
            </button>

            <form onSubmit={confirmar} className="space-y-3">
              {lineas
                .filter((l) => l.disponible > 0)
                .map((l) => (
                  <div key={l.venta_detalle_id} className="flex items-center justify-between gap-3 text-sm">
                    <div>
                      <p className="text-pine-900">{l.nombre}</p>
                      <p className="text-xs text-pine-700/60">disponible: {l.disponible}</p>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max={l.disponible}
                      value={cantidades[l.venta_detalle_id] || ""}
                      onChange={(e) => actualizar(l.venta_detalle_id, e.target.value)}
                      className="w-20 rounded-sm border border-sage-200 px-2 py-1.5 text-sm outline-none focus:border-pine-500"
                    />
                  </div>
                ))}

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-pine-700/60">
                  Motivo (opcional)
                </label>
                <input
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="w-full rounded-sm border border-sage-200 px-3 py-2 text-sm outline-none focus:border-pine-500"
                  placeholder="Ej. producto vencido, cliente se equivocó..."
                />
              </div>

              <p className="font-label text-sm text-pine-900">
                Total a devolver: <span className="font-medium">S/ {total.toFixed(2)}</span>
              </p>

              {error && <p className="text-sm text-alert">{error}</p>}

              <div className="flex justify-end gap-2 border-t border-sage-200 pt-3">
                <button
                  type="button"
                  onClick={() => setAbierto(false)}
                  className="rounded-sm border border-sage-200 px-4 py-2 text-sm text-pine-900 hover:bg-sage-200/30"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  className="rounded-sm bg-alert px-4 py-2 text-sm font-medium text-paper hover:opacity-90 disabled:opacity-50"
                >
                  {enviando ? "Procesando..." : "Confirmar devolución"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
