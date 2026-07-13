import { LoginForm } from "@/components/LoginForm";

// Componente de servidor: fuerza renderizado dinámico (una petición por
// visita) en vez de que Next.js intente generar esta página como HTML
// estático durante el build, momento en el que las variables de entorno
// de Supabase todavía podrían no estar disponibles.
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return <LoginForm />;
}
