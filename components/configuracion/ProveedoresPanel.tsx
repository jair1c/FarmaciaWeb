"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

type Proveedor = { id: string; nombre: string; ruc: string | null; telefono: string | null; contacto: string | null };

export function ProveedoresPanel({ proveedores }: { proveedores: Proveedor[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ nombre: "", ruc: "", telefono: "", contacto: "" });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);

    const res = await fetch("/api/proveedores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      setEnviando(false);
      return;
    }

    setForm({ nombre: "", ruc: "", telefono: "", contacto: "" });
    setEnviando(false);
    router.refresh();
  }

  async function eliminar(id: string) {
    setError(null);
    const res = await fetch("/api/proveedores", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="rounded-sm border border-sage-200 bg-white p-5">
      <h2 className="font-display text-lg font-semibold text-pine-900">Proveedores</h2>
      <p className="mt-0.5 text-sm text-pine-700/70">Para usar en el módulo de Compras</p>

      <form onSubmit={agregar} className="mt-4 grid grid-cols-2 gap-2">
        <input
          required
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          placeholder="Nombre *"
          className="col-span-2 rounded-sm border border-sage-200 px-3 py-2 text-sm outline-none focus:border-pine-500"
        />
        <input
          value={form.ruc}
          onChange={(e) => setForm({ ...form, ruc: e.target.value })}
          placeholder="RUC"
          className="rounded-sm border border-sage-200 px-3 py-2 text-sm outline-none focus:border-pine-500"
        />
        <input
          value={form.telefono}
          onChange={(e) => setForm({ ...form, telefono: e.target.value })}
          placeholder="Teléfono"
          className="rounded-sm border border-sage-200 px-3 py-2 text-sm outline-none focus:border-pine-500"
        />
        <input
          value={form.contacto}
          onChange={(e) => setForm({ ...form, contacto: e.target.value })}
          placeholder="Persona de contacto"
          className="col-span-2 rounded-sm border border-sage-200 px-3 py-2 text-sm outline-none focus:border-pine-500"
        />
        <button
          type="submit"
          disabled={enviando}
          className="col-span-2 rounded-sm bg-pine-900 py-2 text-sm font-medium text-paper hover:bg-pine-700 disabled:opacity-50"
        >
          Agregar proveedor
        </button>
      </form>

      {error && <p className="mt-2 text-sm text-alert">{error}</p>}

      <ul className="mt-4 divide-y divide-sage-200">
        {proveedores.length === 0 && (
          <li className="py-3 text-sm text-pine-700/50">Todavía no hay proveedores.</li>
        )}
        {proveedores.map((p) => (
          <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
            <div>
              <p className="text-pine-900">{p.nombre}</p>
              <p className="text-xs text-pine-700/50">
                {[p.ruc, p.telefono, p.contacto].filter(Boolean).join(" · ") || "Sin datos adicionales"}
              </p>
            </div>
            <button onClick={() => eliminar(p.id)} className="text-alert/70 hover:text-alert">
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
