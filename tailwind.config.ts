import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta "botica": verde pino profundo + ámbar de frasco antiguo + papel cálido
        pine: {
          950: "#12211D",
          900: "#1F3A34",
          700: "#2E5147",
          500: "#4A7566",
        },
        sage: {
          400: "#8FA593",
          200: "#D9E2D8",
        },
        amber: {
          600: "#B08A1E",
          500: "#C9A227",
          100: "#F3E9C7",
        },
        paper: "#F7F5EF",
        alert: "#C1443C",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        label: ["var(--font-label)", "monospace"],
      },
      borderRadius: {
        sm: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
