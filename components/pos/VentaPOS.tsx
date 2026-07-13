"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Trash2, Plus, Minus } from "lucide-react";

type Producto = {
  id: string;
  nombre: string;
  precio_venta: number;
  codigo_barras: string | null;
  stock: number;
};

type Cliente = {
  id: string;
  nombre: string;
  numero_documento: string | null;
};

type ItemCarrito = {
  producto_id: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  stock: number;
};

export function VentaPOS({ productos, clientes }: { productos: Producto[]; clientes: Cliente[] }) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [clienteId, setClienteId] = useState<string>("");
  const [tipoComprobante, setTipoComprobante] = useState("TICKET");
  const [metodoPago, setMetodoPago] = useState("EFECTIVO");
  const [estadoPago, setEstadoPago] = useState("PAGADO");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resultados = useMemo(() => {
    if (!busqueda.trim()) return [];
    const q = busqueda.toLowerCase();
    return productos
      .filter((p) => p.nombre.toLowerCase().includes(q) || p.codigo_barras === busqueda)
      .slice(0, 8);
  }, [busqueda, productos]);

  function agregarProducto(p: Producto) {
    setCarrito((prev) => {
      const existente = prev.find((i) => i.producto_id === p.id);
      if (existente) {
        if (existente.cantidad >= p.stock) return prev;
        return prev.map((i) =>
          i.producto_id === p.id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      if (p.stock <= 0) return prev;
      return [
        ...prev,
        { producto_id: p.id, nombre: p.nombre, cantidad: 1, precio_unitario: p.precio_venta, stock: p.stock },
      ];
    });
    setBusqueda("");
  }

  function cambiarCantidad(producto_id: string, delta: number) {
    setCarrito((prev) =>
      prev
        .map((i) =>
          i.producto_id === producto_id
            ? { ...i, cantidad: Math.min(Math.max(i.cantidad + delta, 1), i.stock) }
            : i
        )
    );
  }

  function quitar(producto_id: string) {
    setCarrito((prev) => prev.filter((i) => i.producto_id !== producto_id));
  }

  const subtotal = carrito.reduce((a, i) => a + i.cantidad * i.precio_unitario, 0);
  const igv = Math.round(subtotal * 0.18 * 100) / 100;
  const total = subtotal + igv;

  async function confirmarVenta() {
    if (carrito.length === 0) return;
    setEnviando(true);
    setError(null);

    try {
      const res = await fetch("/api/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_id: clienteId || null,
          tipo_comprobante: tipoComprobante,
          metodo_pago: metodoPago,
          estado_pago: estadoPago,
          items: carrito.map((i) => ({
            producto_id: i.producto_id,
            cantidad: i.cantidad,
            precio_unitario: i.precio_unitario,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "No se pudo registrar la venta");
        setEnviando(false);
        return;
      }

      router.push(`/ventas/${data.venta_id}/ticket`);
    } catch {
      setError("Error de conexión. Intenta nuevamente.");
      setEnviando(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Columna izquierda: búsqueda y carrito */}
      <div className="lg:col-span-2">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-pine-700/50" />
          <input
            autoFocus
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o escanear código de barras..."
            className="w-full rounded-sm border border-sage-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-pine-500 focus:ring-1 focus:ring-pine-500"
          />
          {resultados.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-sm border border-sage-200 bg-white shadow-md">
              {resultados.map((p) => (
                <button
                  key={p.id}
                  onClick={() => agregarProducto(p)}
                  disabled={p.stock <= 0}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-sage-200/30 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span>{p.nombre}</span>
                  <span className="font-label text-xs text-pine-700/60">
                    S/ {p.precio_venta.toFixed(2)} · stock {p.stock}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 overflow-hidden rounded-sm border border-sage-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-sage-200 bg-sage-200/30 text-xs uppercase tracking-wide text-pine-700/70">
              <tr>
                <th className="px-4 py-2.5">Producto</th>
                <th className="px-4 py-2.5">Cantidad</th>
                <th className="px-4 py-2.5">Precio</th>
                <th className="px-4 py-2.5">Subtotal</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {carrito.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-pine-700/50">
                    El carrito está vacío. Busca un producto para empezar.
                  </td>
                </tr>
              )}
              {carrito.map((i) => (
                <tr key={i.producto_id} className="border-b border-sage-200 last:border-0">
                  <td className="px-4 py-3 font-medium text-pine-900">{i.nombre}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => cambiarCantidad(i.producto_id, -1)} className="rounded-sm border border-sage-200 p-1 hover:bg-sage-200/30">
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center font-label">{i.cantidad}</span>
                      <button onClick={() => cambiarCantidad(i.producto_id, 1)} className="rounded-sm border border-sage-200 p-1 hover:bg-sage-200/30">
                        <Plus size={12} />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-label">S/ {i.precio_unitario.toFixed(2)}</td>
                  <td className="px-4 py-3 font-label">S/ {(i.cantidad * i.precio_unitario).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => quitar(i.producto_id)} className="text-alert/70 hover:text-alert">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Columna derecha: checkout */}
      <div className="space-y-4 rounded-sm border border-sage-200 bg-white p-5 h-fit">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-pine-700/60">Cliente</label>
          <select
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            className="w-full rounded-sm border border-sage-200 px-3 py-2 text-sm outline-none focus:border-pine-500"
          >
            <option value="">Cliente varios</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} {c.numero_documento ? `· ${c.numero_documento}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-pine-700/60">Comprobante</label>
          <select
            value={tipoComprobante}
            onChange={(e) => setTipoComprobante(e.target.value)}
            className="w-full rounded-sm border border-sage-200 px-3 py-2 text-sm outline-none focus:border-pine-500"
          >
            <option value="TICKET">Ticket interno</option>
            <option value="BOLETA">Boleta electrónica</option>
            <option value="FACTURA">Factura electrónica</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-pine-700/60">Estado de pago</label>
          <select
            value={estadoPago}
            onChange={(e) => setEstadoPago(e.target.value)}
            className="w-full rounded-sm border border-sage-200 px-3 py-2 text-sm outline-none focus:border-pine-500"
          >
            <option value="PAGADO">Pagado</option>
            <option value="CREDITO">Al crédito</option>
          </select>
        </div>

        {estadoPago === "PAGADO" && (
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-pine-700/60">Método de pago</label>
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
        )}

        {estadoPago === "CREDITO" && (
          <p className="rounded-sm bg-amber-100 px-3 py-2 text-xs text-pine-900">
            Esta venta quedará registrada como cuenta por cobrar en el módulo de Cobranza.
          </p>
        )}

        <div className="space-y-1 border-t border-sage-200 pt-3 font-label text-sm">
          <div className="flex justify-between text-pine-700/70">
            <span>Subtotal</span>
            <span>S/ {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-pine-700/70">
            <span>IGV (18%)</span>
            <span>S/ {igv.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-medium text-pine-900">
            <span>Total</span>
            <span>S/ {total.toFixed(2)}</span>
          </div>
        </div>

        {error && <p className="text-sm text-alert">{error}</p>}

        <button
          onClick={confirmarVenta}
          disabled={carrito.length === 0 || enviando}
          className="w-full rounded-sm bg-pine-900 py-2.5 text-sm font-medium text-paper hover:bg-pine-700 disabled:opacity-50"
        >
          {enviando ? "Registrando..." : "Confirmar venta"}
        </button>
      </div>
    </div>
  );
}
