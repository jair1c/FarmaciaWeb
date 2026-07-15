"use client";

import { useState } from "react";
import { CerrarCajaModal } from "./CerrarCajaModal";

type Turno = {
  id: string;
  monto_apertura: number;
  abierto_en: string;
  usuario_apertura_nombre: string;
};

export function EstadoCajaAbierta({ turno }: { turno: Turno }) {
  const [modalAbierto, setModalAbierto] = useState(false);

  return (
    <div className="mx-auto max-w-sm rounded-sm border border-amber-500/40 bg-amber-100 p-6 text-center">
      <p className="label-chip">Caja abierta</p>
      <p className="mt-3 text-sm text-pine-900">
        Abierta por <span className="font-medium">{turno.usuario_apertura_nombre}</span>
      </p>
      <p className="text-xs text-pine-700/60">
        {new Date(turno.abierto_en).toLocaleString("es-PE")}
      </p>
      <p className="mt-3 font-label text-2xl text-pine-900">S/ {turno.monto_apertura.toFixed(2)}</p>
      <p className="text-xs text-pine-700/60">monto inicial</p>

      <button
        onClick={() => setModalAbierto(true)}
        className="mt-5 w-full rounded-sm bg-pine-900 py-2.5 text-sm font-medium text-paper hover:bg-pine-700"
      >
        Cerrar caja
      </button>

      {modalAbierto && (
        <CerrarCajaModal turno={turno} onCerrar={() => setModalAbierto(false)} />
      )}
    </div>
  );
}
