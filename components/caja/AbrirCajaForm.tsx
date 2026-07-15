"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AbrirCajaForm() {
  const router = useRouter();
  const [monto, setMonto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function abrir(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);

    const res = await fetch("/api/caja", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monto_apertura: Number(monto) }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      setEnviando(false);
      return;
    }

    router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm rounded-sm border border-sage-200 bg-white p-6 text-center">
      <p className="label-chip">Caja cerrada</p>
      <h2 className="mt-3 font-display text-lg font-semibold text-pine-900">Abrir caja</h2>
      <p className="mt-1 text-sm text-pine-700/70">
        Cuenta el efectivo con el que empiezas el turno e indícalo aquí.
      </p>

      <form onSubmit={abrir} className="mt-4 space-y-3">
        <input
          required
          type="number"
          step="0.01"
          min="0"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          placeholder="Monto inicial (S/)"
          className="w-full rounded-sm border border-sage-200 px-3 py-2 text-center text-sm outline-none focus:border-pine-500"
        />

        {error && <p className="text-sm text-alert">{error}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-sm bg-pine-900 py-2.5 text-sm font-medium text-paper hover:bg-pine-700 disabled:opacity-50"
        >
          {enviando ? "Abriendo..." : "Abrir caja"}
        </button>
      </form>
    </div>
  );
}
