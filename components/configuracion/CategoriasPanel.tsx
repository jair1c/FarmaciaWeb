"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

type Categoria = { id: string; nombre: string };

export function CategoriasPanel({ categorias }: { categorias: Categoria[] }) {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function agregar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);

    const res = await fetch("/api/categorias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      setEnviando(false);
      return;
    }

    setNombre("");
    setEnviando(false);
    router.refresh();
  }

  async function eliminar(id: string) {
    setError(null);
    const res = await fetch("/api/categorias", {
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
      <h2 className="font-display text-lg font-semibold text-pine-900">Categorías</h2>
      <p className="mt-0.5 text-sm text-pine-700/70">Para organizar el catálogo de productos</p>

      <form onSubmit={agregar} className="mt-4 flex gap-2">
        <input
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej. Analgésicos"
          className="flex-1 rounded-sm border border-sage-200 px-3 py-2 text-sm outline-none focus:border-pine-500"
        />
        <button
          type="submit"
          disabled={enviando}
          className="rounded-sm bg-pine-900 px-4 py-2 text-sm font-medium text-paper hover:bg-pine-700 disabled:opacity-50"
        >
          Agregar
        </button>
      </form>

      {error && <p className="mt-2 text-sm text-alert">{error}</p>}

      <ul className="mt-4 divide-y divide-sage-200">
        {categorias.length === 0 && (
          <li className="py-3 text-sm text-pine-700/50">Todavía no hay categorías.</li>
        )}
        {categorias.map((c) => (
          <li key={c.id} className="flex items-center justify-between py-2.5 text-sm">
            <span className="text-pine-900">{c.nombre}</span>
            <button onClick={() => eliminar(c.id)} className="text-alert/70 hover:text-alert">
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
