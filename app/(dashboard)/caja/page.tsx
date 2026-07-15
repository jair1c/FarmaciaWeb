import { createClient } from "@/lib/supabase/server";
import { requireRol } from "@/lib/auth-server";
import { AbrirCajaForm } from "@/components/caja/AbrirCajaForm";
import { EstadoCajaAbierta } from "@/components/caja/EstadoCajaAbierta";

async function getDatos(sucursalId: string) {
  const supabase = createClient();

  const [{ data: turnoAbierto }, { data: historial }] = await Promise.all([
    supabase
      .from("turnos_caja")
      .select("id, monto_apertura, abierto_en, perfiles!turnos_caja_usuario_apertura_id_fkey(nombre)")
      .eq("sucursal_id", sucursalId)
      .eq("estado", "ABIERTO")
      .maybeSingle(),
    supabase
      .from("turnos_caja")
      .select(
        "id, monto_apertura, monto_cierre_contado, monto_cierre_esperado, diferencia, abierto_en, cerrado_en, perfiles!turnos_caja_usuario_cierre_id_fkey(nombre)"
      )
      .eq("sucursal_id", sucursalId)
      .eq("estado", "CERRADO")
      .order("cerrado_en", { ascending: false })
      .limit(15),
  ]);

  return { turnoAbierto, historial: historial ?? [] };
}

export default async function CajaPage() {
  const perfil = await requireRol(["admin", "farmaceutico", "cajero"]);

  if (!perfil.sucursal_id) {
    return (
      <div>
        <h1 className="font-display text-2xl font-semibold text-pine-900">Caja</h1>
        <p className="mt-2 text-sm text-alert">
          Tu usuario no tiene una sucursal asignada. Pide a un administrador que la configure.
        </p>
      </div>
    );
  }

  const { turnoAbierto, historial } = await getDatos(perfil.sucursal_id);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-pine-900">Caja</h1>
      <p className="mt-1 text-sm text-pine-700/70">Apertura, cierre y control de efectivo del turno</p>

      <div className="mt-6">
        {turnoAbierto ? (
          <EstadoCajaAbierta
            turno={{
              id: turnoAbierto.id,
              monto_apertura: Number(turnoAbierto.monto_apertura),
              abierto_en: turnoAbierto.abierto_en,
              usuario_apertura_nombre: (turnoAbierto.perfiles as any)?.nombre ?? "—",
            }}
          />
        ) : (
          <AbrirCajaForm />
        )}
      </div>

      <div className="mt-10">
        <h2 className="font-display text-lg font-semibold text-pine-900">Historial de cierres</h2>
        <div className="mt-3 overflow-hidden rounded-sm border border-sage-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-sage-200 bg-sage-200/30 text-xs uppercase tracking-wide text-pine-700/70">
              <tr>
                <th className="px-4 py-3">Fecha cierre</th>
                <th className="px-4 py-3">Cerrado por</th>
                <th className="px-4 py-3">Apertura</th>
                <th className="px-4 py-3">Esperado</th>
                <th className="px-4 py-3">Contado</th>
                <th className="px-4 py-3">Diferencia</th>
              </tr>
            </thead>
            <tbody>
              {historial.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-pine-700/50">
                    Todavía no hay cierres de caja registrados.
                  </td>
                </tr>
              )}
              {historial.map((t: any) => {
                const diferencia = Number(t.diferencia);
                return (
                  <tr key={t.id} className="border-b border-sage-200 last:border-0">
                    <td className="px-4 py-3 text-pine-700/70">
                      {new Date(t.cerrado_en).toLocaleString("es-PE")}
                    </td>
                    <td className="px-4 py-3 text-pine-900">{t.perfiles?.nombre ?? "—"}</td>
                    <td className="px-4 py-3 font-label">S/ {Number(t.monto_apertura).toFixed(2)}</td>
                    <td className="px-4 py-3 font-label">S/ {Number(t.monto_cierre_esperado).toFixed(2)}</td>
                    <td className="px-4 py-3 font-label">S/ {Number(t.monto_cierre_contado).toFixed(2)}</td>
                    <td
                      className={`px-4 py-3 font-label font-medium ${
                        diferencia === 0 ? "text-pine-900" : diferencia > 0 ? "text-amber-600" : "text-alert"
                      }`}
                    >
                      {diferencia > 0 ? "+" : ""}
                      S/ {diferencia.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
