import { Sidebar } from "@/components/Sidebar";
import { getPerfilActual } from "@/lib/auth-server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const perfil = await getPerfilActual();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar rol={perfil?.rol ?? "cajero"} nombre={perfil?.nombre} />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
