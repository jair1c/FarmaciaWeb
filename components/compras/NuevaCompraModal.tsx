"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Trash2, Plus } from "lucide-react";

type Producto = { id: string; nombre: string };
type Proveedor = { id: string; nombre: string };

type Linea = {
  producto_id: string;
  cantidad: string;
  costo_unitario: string;
  numero_lote: string;
  fecha_vencimiento: string;
};

const lineaVacia: Linea = {
  producto_id: "",
  cantidad: "",
  costo_unitario: "",
  numero_lote: "",
  fecha_vencimiento: "",
};

export function NuevaCompraModal({ productos, proveedores }: { productos: Producto[]; proveedores: Proveedor[] }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [proveedorId, setProveedorId] = useState("");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [lineas, setLineas] = useState<Linea[]>([{ ...lineaVacia }]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function actualizarLinea(idx: number, campo: keyof Linea, valor: string) {
    setLineas((prev) => prev.map((l, i) => (i === idx ? { ...l, [campo]: valor } : l)));
  }

  function agregarLinea() {
    setLineas((prev) => [...prev, { ...lineaVacia }]);
  }

  function quitarLinea(idx: number) {
    setLineas((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
  }

  function cerrar() {
    setAbierto(false);
    setError(null);
  }

  const total = lineas.reduce(
    (a, l) => a + (Number(l.cantidad) || 0) * (Number(l.costo_unitario) || 0),
    0
  );

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);

    const res = await fetch("/api/compras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        proveedor_id: proveedorId || null,
        numero_documento: numeroDocumento || null,
        items: lineas.map((l) => ({
          producto_id: l.producto_id,
          cantidad: Number(l.cantidad),
          costo_unitario: Number(l.costo_unitario),
          numero_lote: l.numero_lote,
          fecha_vencimiento: l.fecha_vencimiento,
        })),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "No se pudo registrar la compra");
      setEnviando(false);
      return;
    }

    setEnviando(false);
    setAbierto(false);
    setProveedorId("");
    setNumeroDocumento("");
    setLineas([{ ...lineaVacia }]);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="rounded-sm bg-pine-900 px-4 py-2 text-sm font-medium text-paper hover:bg-pine-700"
      >
        Nueva compra
      </button>

      {abierto && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-pine-950/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-sm bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-pine-900">Nueva compra</h2>
              <button onClick={cerrar} className="text-pine-700/50 hover:text-pine-900">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={guardar} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-pine-700/60">
                    Proveedor
                  </label>
                  <select
                    value={proveedorId}
                    onChange={(e) => setProveedorId(e.target.value)}
                    className="w-full rounded-sm border border-sage-200 px-3 py-2 text-sm outline-none focus:border-pine-500"
                  >
                    <option value="">Sin proveedor</option>
                    {proveedores.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-pine-700/60">
                    N° de documento (factura/guía)
                  </label>
                  <input
                    value={numeroDocumento}
                    onChange={(e) => setNumeroDocumento(e.target.value)}
                    className="w-full rounded-sm border border-sage-200 px-3 py-2 text-sm outline-none focus:border-pine-500"
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div className="rounded-sm border border-sage-200">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-sage-200 bg-sage-200/30 text-xs uppercase tracking-wide text-pine-700/70">
                    <tr>
                      <th className="px-3 py-2">Producto</th>
                      <th className="px-3 py-2 w-20">Cant.</th>
                      <th className="px-3 py-2 w-24">Costo U.</th>
                      <th className="px-3 py-2 w-32">N° lote</th>
                      <th className="px-3 py-2 w-36">Vencimiento</th>
                      <th className="px-3 py-2 w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {lineas.map((l, idx) => (
                      <tr key={idx} className="border-b border-sage-200 last:border-0">
                        <td className="px-3 py-2">
                          <select
                            required
                            value={l.producto_id}
                            onChange={(e) => actualizarLinea(idx, "producto_id", e.target.value)}
                            className="w-full rounded-sm border border-sage-200 px-2 py-1.5 text-sm outline-none focus:border-pine-500"
                          >
                            <option value="">Seleccionar...</option>
                            {productos.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.nombre}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            required
                            type="number"
                            min="1"
                            value={l.cantidad}
                            onChange={(e) => actualizarLinea(idx, "cantidad", e.target.value)}
                            className="w-full rounded-sm border border-sage-200 px-2 py-1.5 text-sm outline-none focus:border-pine-500"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            required
                            type="number"
                            step="0.01"
                            min="0"
                            value={l.costo_unitario}
                            onChange={(e) => actualizarLinea(idx, "costo_unitario", e.target.value)}
                            className="w-full rounded-sm border border-sage-200 px-2 py-1.5 text-sm outline-none focus:border-pine-500"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            required
                            value={l.numero_lote}
                            onChange={(e) => actualizarLinea(idx, "numero_lote", e.target.value)}
                            className="w-full rounded-sm border border-sage-200 px-2 py-1.5 text-sm outline-none focus:border-pine-500"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            required
                            type="date"
                            value={l.fecha_vencimiento}
                            onChange={(e) => actualizarLinea(idx, "fecha_vencimiento", e.target.value)}
                            className="w-full rounded-sm border border-sage-200 px-2 py-1.5 text-sm outline-none focus:border-pine-500"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <button type="button" onClick={() => quitarLinea(idx)} className="text-alert/70 hover:text-alert">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button
                  type="button"
                  onClick={agregarLinea}
                  className="flex w-full items-center justify-center gap-1.5 border-t border-sage-200 py-2 text-xs font-medium text-pine-700 hover:bg-sage-200/20"
                >
                  <Plus size={13} /> Agregar línea
                </button>
              </div>

              <div className="flex items-center justify-between">
                <p className="font-label text-sm text-pine-700/70">
                  Total: <span className="font-medium text-pine-900">S/ {total.toFixed(2)}</span>
                </p>
              </div>

              {error && <p className="text-sm text-alert">{error}</p>}

              <div className="flex justify-end gap-2 border-t border-sage-200 pt-3">
                <button
                  type="button"
                  onClick={cerrar}
                  className="rounded-sm border border-sage-200 px-4 py-2 text-sm text-pine-900 hover:bg-sage-200/30"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  className="rounded-sm bg-pine-900 px-4 py-2 text-sm font-medium text-paper hover:bg-pine-700 disabled:opacity-50"
                >
                  {enviando ? "Guardando..." : "Registrar compra"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
