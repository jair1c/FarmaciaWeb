"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

type Categoria = { id: string; nombre: string };

export function NuevoProductoModal({ categorias }: { categorias: Categoria[] }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agregarStock, setAgregarStock] = useState(true);

  const [form, setForm] = useState({
    nombre: "",
    categoria_id: "",
    codigo_barras: "",
    requiere_receta: false,
    precio_venta: "",
    stock_minimo: "5",
    unidad_medida: "unidad",
    numero_lote: "",
    fecha_vencimiento: "",
    cantidad_inicial: "",
    costo_unitario: "",
  });

  function actualizar<K extends keyof typeof form>(campo: K, valor: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function cerrar() {
    setAbierto(false);
    setError(null);
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);

    const res = await fetch("/api/productos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: form.nombre,
        categoria_id: form.categoria_id || null,
        codigo_barras: form.codigo_barras,
        requiere_receta: form.requiere_receta,
        precio_venta: Number(form.precio_venta),
        stock_minimo: Number(form.stock_minimo),
        unidad_medida: form.unidad_medida,
        lote_inicial: agregarStock
          ? {
              numero_lote: form.numero_lote,
              fecha_vencimiento: form.fecha_vencimiento,
              cantidad_inicial: Number(form.cantidad_inicial),
              costo_unitario: Number(form.costo_unitario || 0),
            }
          : null,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "No se pudo crear el producto");
      setEnviando(false);
      return;
    }

    setEnviando(false);
    setAbierto(false);
    setForm({
      nombre: "",
      categoria_id: "",
      codigo_barras: "",
      requiere_receta: false,
      precio_venta: "",
      stock_minimo: "5",
      unidad_medida: "unidad",
      numero_lote: "",
      fecha_vencimiento: "",
      cantidad_inicial: "",
      costo_unitario: "",
    });
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="rounded-sm bg-pine-900 px-4 py-2 text-sm font-medium text-paper hover:bg-pine-700"
      >
        Nuevo producto
      </button>

      {abierto && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-pine-950/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-sm bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-pine-900">Nuevo producto</h2>
              <button onClick={cerrar} className="text-pine-700/50 hover:text-pine-900">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={guardar} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-pine-700/60">
                    Nombre *
                  </label>
                  <input
                    required
                    value={form.nombre}
                    onChange={(e) => actualizar("nombre", e.target.value)}
                    className="w-full rounded-sm border border-sage-200 px-3 py-2 text-sm outline-none focus:border-pine-500"
                    placeholder="Paracetamol 500mg"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-pine-700/60">
                    Categoría
                  </label>
                  <select
                    value={form.categoria_id}
                    onChange={(e) => actualizar("categoria_id", e.target.value)}
                    className="w-full rounded-sm border border-sage-200 px-3 py-2 text-sm outline-none focus:border-pine-500"
                  >
                    <option value="">Sin categoría</option>
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-pine-700/60">
                    Código de barras
                  </label>
                  <input
                    value={form.codigo_barras}
                    onChange={(e) => actualizar("codigo_barras", e.target.value)}
                    className="w-full rounded-sm border border-sage-200 px-3 py-2 text-sm outline-none focus:border-pine-500"
                    placeholder="Opcional"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-pine-700/60">
                    Precio de venta (S/) *
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.precio_venta}
                    onChange={(e) => actualizar("precio_venta", e.target.value)}
                    className="w-full rounded-sm border border-sage-200 px-3 py-2 text-sm outline-none focus:border-pine-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-pine-700/60">
                    Stock mínimo
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.stock_minimo}
                    onChange={(e) => actualizar("stock_minimo", e.target.value)}
                    className="w-full rounded-sm border border-sage-200 px-3 py-2 text-sm outline-none focus:border-pine-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-pine-700/60">
                    Unidad de medida
                  </label>
                  <select
                    value={form.unidad_medida}
                    onChange={(e) => actualizar("unidad_medida", e.target.value)}
                    className="w-full rounded-sm border border-sage-200 px-3 py-2 text-sm outline-none focus:border-pine-500"
                  >
                    <option value="unidad">Unidad</option>
                    <option value="caja">Caja</option>
                    <option value="blister">Blíster</option>
                    <option value="ml">Mililitros</option>
                    <option value="frasco">Frasco</option>
                  </select>
                </div>

                <label className="col-span-2 flex items-center gap-2 text-sm text-pine-900">
                  <input
                    type="checkbox"
                    checked={form.requiere_receta}
                    onChange={(e) => actualizar("requiere_receta", e.target.checked)}
                  />
                  Requiere receta médica
                </label>
              </div>

              <label className="flex items-center gap-2 border-t border-sage-200 pt-3 text-sm text-pine-900">
                <input
                  type="checkbox"
                  checked={agregarStock}
                  onChange={(e) => setAgregarStock(e.target.checked)}
                />
                Agregar stock inicial (crea el primer lote)
              </label>

              {agregarStock && (
                <div className="grid grid-cols-2 gap-3 rounded-sm bg-sage-200/20 p-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-pine-700/60">
                      N° de lote *
                    </label>
                    <input
                      required={agregarStock}
                      value={form.numero_lote}
                      onChange={(e) => actualizar("numero_lote", e.target.value)}
                      className="w-full rounded-sm border border-sage-200 px-3 py-2 text-sm outline-none focus:border-pine-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-pine-700/60">
                      Fecha de vencimiento *
                    </label>
                    <input
                      required={agregarStock}
                      type="date"
                      value={form.fecha_vencimiento}
                      onChange={(e) => actualizar("fecha_vencimiento", e.target.value)}
                      className="w-full rounded-sm border border-sage-200 px-3 py-2 text-sm outline-none focus:border-pine-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-pine-700/60">
                      Cantidad *
                    </label>
                    <input
                      required={agregarStock}
                      type="number"
                      min="1"
                      value={form.cantidad_inicial}
                      onChange={(e) => actualizar("cantidad_inicial", e.target.value)}
                      className="w-full rounded-sm border border-sage-200 px-3 py-2 text-sm outline-none focus:border-pine-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-pine-700/60">
                      Costo unitario (S/)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.costo_unitario}
                      onChange={(e) => actualizar("costo_unitario", e.target.value)}
                      className="w-full rounded-sm border border-sage-200 px-3 py-2 text-sm outline-none focus:border-pine-500"
                    />
                  </div>
                </div>
              )}

              {error && <p className="text-sm text-alert">{error}</p>}

              <div className="flex justify-end gap-2 pt-2">
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
                  {enviando ? "Guardando..." : "Guardar producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
