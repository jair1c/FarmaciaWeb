"use client";

import { useMemo, useState } from "react";

type Registro = {
  id: string;
  tabla: string;
  operacion: "INSERT" | "UPDATE" | "DELETE";
  datos_anteriores: Record<string, any> | null;
  datos_nuevos: Record<string, any> | null;
  usuario_nombre: string | null;
  creado_en: string;
};

const ETIQUETA_CAMPO: Record<string, string> = {
  nombre: "Nombre",
  precio_venta: "Precio",
  stock_minimo: "Stock mínimo",
  activo: "Activo",
  rol: "Rol",
  categoria_id: "Categoría",
  codigo_barras: "Código de barras",
  requiere_receta: "Requiere receta",
  unidad_medida: "Unidad",
  sucursal_id: "Sucursal",
};

const ETIQUETA_TABLA: Record<string, string> = {
  productos: "Productos",
  perfiles: "Personal",
};

const CAMPOS_IGNORADOS = new Set(["id", "creado_en", "updated_at", "email"]);

function formatearValor(v: any) {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Sí" : "No";
  return String(v);
}

function calcularCambios(anteriores: Record<string, any> | null, nuevos: Record<string, any> | null) {
  if (!anteriores || !nuevos) return [];
  const cambios: { campo: string; antes: any; despues: any }[] = [];
  const keys = new Set([...Object.keys(anteriores), ...Object.keys(nuevos)]);
  for (const k of keys) {
    if (CAMPOS_IGNORADOS.has(k)) continue;
    if (JSON.stringify(anteriores[k]) !== JSON.stringify(nuevos[k])) {
      cambios.push({ campo: ETIQUETA_CAMPO[k] ?? k, antes: anteriores[k], despues: nuevos[k] });
    }
  }
  return cambios;
}

export function AuditoriaTable({ registros }: { registros: Registro[] }) {
  const [filtroTabla, setFiltroTabla] = useState("");

  const tablas = useMemo(() => [...new Set(registros.map((r) => r.tabla))], [registros]);

  const filtrados = useMemo(
    () => (filtroTabla ? registros.filter((r) => r.tabla === filtroTabla) : registros),
    [filtroTabla, registros]
  );

  return (
    <div>
      <select
        value={filtroTabla}
        onChange={(e) => setFiltroTabla(e.target.value)}
        className="rounded-sm border border-sage-200 bg-white px-3 py-2 text-sm outline-none focus:border-pine-500"
      >
        <option value="">Todas las tablas</option>
        {tablas.map((t) => (
          <option key={t} value={t}>
            {ETIQUETA_TABLA[t] ?? t}
          </option>
        ))}
      </select>

      <div className="mt-4 space-y-2">
        {filtrados.length === 0 && (
          <p className="rounded-sm border border-sage-200 bg-white px-4 py-8 text-center text-sm text-pine-700/50">
            No hay registros de auditoría todavía.
          </p>
        )}

        {filtrados.map((r) => {
          const nombreRegistro = (r.datos_nuevos ?? r.datos_anteriores)?.nombre ?? "";
          const cambios = r.operacion === "UPDATE" ? calcularCambios(r.datos_anteriores, r.datos_nuevos) : [];

          return (
            <div key={r.id} className="rounded-sm border border-sage-200 bg-white px-4 py-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="label-chip">
                    {r.operacion === "INSERT" ? "Creado" : r.operacion === "DELETE" ? "Eliminado" : "Editado"}
                  </span>
                  <span className="ml-2 text-pine-900">
                    {ETIQUETA_TABLA[r.tabla] ?? r.tabla}
                    {nombreRegistro ? ` · ${nombreRegistro}` : ""}
                  </span>
                </div>
                <div className="text-xs text-pine-700/60">
                  {r.usuario_nombre ?? "Sistema"} · {new Date(r.creado_en).toLocaleString("es-PE")}
                </div>
              </div>

              {cambios.length > 0 && (
                <ul className="mt-2 space-y-1 border-t border-sage-200 pt-2 font-label text-xs">
                  {cambios.map((c, idx) => (
                    <li key={idx} className="text-pine-700/80">
                      <span className="font-medium text-pine-900">{c.campo}:</span>{" "}
                      {formatearValor(c.antes)} → {formatearValor(c.despues)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
