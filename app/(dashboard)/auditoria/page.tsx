import { createClient } from "@/lib/supabase/server";
import { requireRol } from "@/lib/auth-server";
import { AuditoriaTable } from "@/components/auditoria/AuditoriaTable";

async function getAuditoria() {
  const supabase = createClient();
  const { data } = await supabase
    .from("auditoria")
    .select("id, tabla, operacion, datos_anteriores, datos_nuevos, creado_en, perfiles(nombre)")
    .order("creado_en", { ascending: false })
    .limit(200);

  return (data ?? []).map((r: any) => ({
    id: r.id,
    tabla: r.tabla,
    operacion: r.operacion,
    datos_anteriores: r.datos_anteriores,
    datos_nuevos: r.datos_nuevos,
    usuario_nombre: r.perfiles?.nombre ?? null,
    creado_en: r.creado_en,
  }));
}

export default async function AuditoriaPage() {
  await requireRol(["admin"]);
  const registros = await getAuditoria();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-pine-900">Auditoría</h1>
      <p className="mt-1 text-sm text-pine-700/70">
        Quién cambió qué y cuándo — productos (precios, activación) y personal (roles, activación)
      </p>

      <div className="mt-6">
        <AuditoriaTable registros={registros} />
      </div>
    </div>
  );
}
