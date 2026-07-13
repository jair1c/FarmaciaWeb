"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { type Rol } from "@/lib/permisos";

type Usuario = {
  id: string;
  nombre: string;
  email: string | null;
  rol: Rol;
  sucursal_id: string | null;
  activo: boolean;
};

type Sucursal = { id: string; nombre: string };

const ETIQUETA_ROL: Record<Rol, string> = {
  admin: "Administrador",
  farmaceutico: "Farmacéutico",
  cajero: "Cajero",
};

export function UsuariosPanel({ usuarios, sucursales, usuarioActualId }: { usuarios: Usuario[]; sucursales: Sucursal[]; usuarioActualId: string }) {
  const router = useRouter();
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    rol: "cajero" as Rol,
    sucursal_id: sucursales[0]?.id ?? "",
  });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);

    const res = await fetch("/api/usuarios", {
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

    setForm({ nombre: "", email: "", password: "", rol: "cajero", sucursal_id: sucursales[0]?.id ?? "" });
    setEnviando(false);
    router.refresh();
  }

  async function cambiarEstado(id: string, activo: boolean) {
    setError(null);
    const res = await fetch("/api/usuarios", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, activo }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="rounded-sm border border-sage-200 bg-white p-5 lg:col-span-2">
      <h2 className="font-display text-lg font-semibold text-pine-900">Personal</h2>
      <p className="mt-0.5 text-sm text-pine-700/70">
        Cada persona necesita su propio usuario: así cada venta y cobro queda registrado con quién lo hizo, y puedes
        limitar lo que cada rol ve y hace.
      </p>

      <form onSubmit={crear} className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <input
          required
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          placeholder="Nombre completo"
          className="col-span-2 rounded-sm border border-sage-200 px-3 py-2 text-sm outline-none focus:border-pine-500 sm:col-span-1"
        />
        <input
          required
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="Correo (será su usuario)"
          className="col-span-2 rounded-sm border border-sage-200 px-3 py-2 text-sm outline-none focus:border-pine-500 sm:col-span-1"
        />
        <input
          required
          type="text"
          minLength={6}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Contraseña temporal"
          className="col-span-2 rounded-sm border border-sage-200 px-3 py-2 text-sm outline-none focus:border-pine-500 sm:col-span-1"
        />
        <select
          value={form.rol}
          onChange={(e) => setForm({ ...form, rol: e.target.value as Rol })}
          className="rounded-sm border border-sage-200 px-3 py-2 text-sm outline-none focus:border-pine-500"
        >
          <option value="cajero">Cajero</option>
          <option value="farmaceutico">Farmacéutico</option>
          <option value="admin">Administrador</option>
        </select>
        <select
          required
          value={form.sucursal_id}
          onChange={(e) => setForm({ ...form, sucursal_id: e.target.value })}
          className="col-span-2 rounded-sm border border-sage-200 px-3 py-2 text-sm outline-none focus:border-pine-500 sm:col-span-3"
        >
          <option value="">Selecciona sucursal...</option>
          {sucursales.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={enviando || !form.sucursal_id}
          className="col-span-2 rounded-sm bg-pine-900 py-2 text-sm font-medium text-paper hover:bg-pine-700 disabled:opacity-50 sm:col-span-4"
        >
          {enviando ? "Creando..." : "Crear usuario"}
        </button>
      </form>

      {error && <p className="mt-2 text-sm text-alert">{error}</p>}

      <div className="mt-4 overflow-hidden rounded-sm border border-sage-200">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-sage-200 bg-sage-200/30 text-xs uppercase tracking-wide text-pine-700/70">
            <tr>
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">Correo</th>
              <th className="px-3 py-2">Rol</th>
              <th className="px-3 py-2">Sucursal</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className="border-b border-sage-200 last:border-0">
                <td className="px-3 py-2.5 font-medium text-pine-900">{u.nombre}</td>
                <td className="px-3 py-2.5 text-pine-700/70">{u.email}</td>
                <td className="px-3 py-2.5">
                  <span className="label-chip">{ETIQUETA_ROL[u.rol]}</span>
                </td>
                <td className="px-3 py-2.5 text-pine-700/70">
                  {sucursales.find((s) => s.id === u.sucursal_id)?.nombre ?? "—"}
                </td>
                <td className="px-3 py-2.5">
                  {u.activo ? (
                    <span className="text-xs text-pine-700">Activo</span>
                  ) : (
                    <span className="text-xs text-alert">Inactivo</span>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  {u.id !== usuarioActualId && (
                    <button
                      onClick={() => cambiarEstado(u.id, !u.activo)}
                      className="text-xs text-pine-700 hover:underline"
                    >
                      {u.activo ? "Desactivar" : "Activar"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
