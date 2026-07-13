"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("No pudimos iniciar sesión. Revisa tu correo y contraseña.");
      setCargando(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="label-chip">Rx · Administración</span>
          <h1 className="mt-4 font-display text-3xl font-semibold text-pine-900">
            Farmacia
          </h1>
          <p className="mt-1 text-sm text-pine-700/70">
            Ingresa para continuar con ventas y cobranza
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-sm border border-sage-200 bg-white p-6 shadow-sm">
          <div>
            <label className="mb-1 block text-sm font-medium text-pine-900">Correo</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-sm border border-sage-200 px-3 py-2 text-sm outline-none focus:border-pine-500 focus:ring-1 focus:ring-pine-500"
              placeholder="admin@tufarmacia.pe"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-pine-900">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-sm border border-sage-200 px-3 py-2 text-sm outline-none focus:border-pine-500 focus:ring-1 focus:ring-pine-500"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-alert">{error}</p>}

          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-sm bg-pine-900 py-2 text-sm font-medium text-paper transition hover:bg-pine-700 disabled:opacity-60"
          >
            {cargando ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </main>
  );
}
