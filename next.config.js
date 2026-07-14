/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Desactiva el "Router Cache" de Next.js para rutas dinámicas (staleTimes.dynamic
  // por defecto es 30s). Sin esto, el navegador podía reusar una respuesta guardada
  // de /login de ANTES de iniciar sesión durante esos 30 segundos, mostrándola de
  // vuelta aunque la sesión ya fuera válida — exactamente el bug que causaba el
  // rebote a /login justo después de entrar.
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 180,
    },
  },
  async headers() {
    return [
      {
        // Refuerzo adicional: nunca cachear /login ni las respuestas RSC asociadas,
        // ni en el navegador ni en la CDN de Vercel.
        source: "/login",
        headers: [
          { key: "Cache-Control", value: "no-store, must-revalidate" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
