import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: perfilQuienLlama } = await supabase.from("perfiles").select("rol").eq("id", user.id).single();

  if (perfilQuienLlama?.rol !== "admin") {
    return NextResponse.json({ error: "Solo un administrador puede crear usuarios" }, { status: 403 });
  }

  const { email, password, nombre, rol, sucursal_id } = await request.json();

  if (!email?.trim() || !password || password.length < 6 || !nombre?.trim() || !rol || !sucursal_id) {
    return NextResponse.json(
      { error: "Completa correo, contraseña (mín. 6 caracteres), nombre, rol y sucursal" },
      { status: 400 }
    );
  }

  if (!["admin", "cajero", "farmaceutico"].includes(rol)) {
    return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: nuevoUsuario, error: errorAuth } = await admin.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
  });

  if (errorAuth || !nuevoUsuario.user) {
    return NextResponse.json({ error: errorAuth?.message ?? "No se pudo crear el usuario" }, { status: 400 });
  }

  const { error: errorPerfil } = await admin.from("perfiles").insert({
    id: nuevoUsuario.user.id,
    nombre: nombre.trim(),
    email: email.trim(),
    rol,
    sucursal_id,
    activo: true,
  });

  if (errorPerfil) {
    // Si falla la creación del perfil, no dejamos un usuario de Auth huérfano
    await admin.auth.admin.deleteUser(nuevoUsuario.user.id);
    return NextResponse.json({ error: errorPerfil.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: NextRequest) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: perfilQuienLlama } = await supabase.from("perfiles").select("rol").eq("id", user.id).single();

  if (perfilQuienLlama?.rol !== "admin") {
    return NextResponse.json({ error: "Solo un administrador puede hacer esto" }, { status: 403 });
  }

  const { id, activo } = await request.json();

  if (id === user.id && activo === false) {
    return NextResponse.json({ error: "No puedes desactivar tu propio usuario" }, { status: 400 });
  }

  const { error } = await supabase.from("perfiles").update({ activo }).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
