"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function EmitirSunatButton({
  ventaId,
  sunatEstado,
  serie,
  numero,
  enlacePdf,
}: {
  ventaId: string;
  sunatEstado: string | null;
  serie: string | null;
  numero: number | null;
  enlacePdf?: string;
}) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function emitir() {
    setEnviando(true);
    setError(null);

    const res = await fetch("/api/facturacion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ venta_id: ventaId }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Nubefact rechazó el comprobante");
      setEnviando(false);
      return;
    }

    setEnviando(false);
    router.refresh();
  }

  if (sunatEstado === "ACEPTADO") {
    return (
      <div className="text-center">
        <p className="label-chip">
          {serie}-{numero} · Aceptado por SUNAT
        </p>
        {enlacePdf && (
          <a href={enlacePdf} target="_blank" className="mt-2 block text-xs text-pine-700 hover:underline">
            Ver PDF oficial
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="text-center">
      {sunatEstado === "RECHAZADO" && (
        <p className="mb-2 text-xs text-alert">
          El último intento fue rechazado por SUNAT/Nubefact. Revisa los datos e intenta de nuevo.
        </p>
      )}
      <button
        onClick={emitir}
        disabled={enviando}
        className="rounded-sm bg-amber-500 px-4 py-2 text-xs font-medium text-pine-950 hover:bg-amber-600 disabled:opacity-50"
      >
        {enviando ? "Enviando a SUNAT..." : "Emitir electrónicamente"}
      </button>
      {error && <p className="mt-2 text-xs text-alert">{error}</p>}
    </div>
  );
}
