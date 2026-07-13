"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Sucursal = { id: string; nombre: string; direccion: string | null; ruc: string | null };

export function SucursalesPanel({ sucursales }: { sucursales: Sucursal[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ nombre: "", direccion: "", ruc: "" });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);

    const res = await fetch("/api/sucursales", {
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

    setForm({ nombre: "", direccion: "", ruc: "" });
    setEnviando(false);
    router.refresh();
  }

  return (
    <div className="rounded-sm border border-sage-200 bg-white p-5">
      <h2 className="font-display text-lg font-semibold text-pine-900">Sucursales</h2>
      <p className="mt-0.5 text-sm text-pine-700/70">Puntos de venta de tu negocio</p>

      <form onSubmit={agregar} className="mt-4 grid grid-cols-2 gap-2">
        <input
          required
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          placeholder="Nombre *"
          className="col-span-2 rounded-sm border border-sage-200 px-3 py-2 text-sm outline-none focus:border-pine-500"
        />
        <input
          value={form.direccion}
          onChange={(e) => setForm({ ...form, direccion: e.target.value })}
          placeholder="Dirección"
          className="col-span-2 rounded-sm border border-sage-200 px-3 py-2 text-sm outline-none focus:border-pine-500"
        />
        <input
          value={form.ruc}
          onChange={(e) => setForm({ ...form, ruc: e.target.value })}
          placeholder="RUC"
          className="col-span-2 rounded-sm border border-sage-200 px-3 py-2 text-sm outline-none focus:border-pine-500"
        />
        <button
          type="submit"
          disabled={enviando}
          className="col-span-2 rounded-sm bg-pine-900 py-2 text-sm font-medium text-paper hover:bg-pine-700 disabled:opacity-50"
        >
          Agregar sucursal
        </button>
      </form>

      {error && <p className="mt-2 text-sm text-alert">{error}</p>}

      <ul className="mt-4 divide-y divide-sage-200">
        {sucursales.length === 0 && (
          <li className="py-3 text-sm text-pine-700/50">Todavía no hay sucursales registradas.</li>
        )}
        {sucursales.map((s) => (
          <li key={s.id} className="py-2.5 text-sm">
            <p className="text-pine-900">{s.nombre}</p>
            {s.direccion && <p className="text-xs text-pine-700/50">{s.direccion}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
