import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resolveGlob = (...segments) => path.resolve(__dirname, ...segments).replace(/\\/g, "/");

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    // Extension webview source files
    "./src/webview/**/*.{ts,tsx,js,jsx}",
    // Bitstream demo/source files
    "./src/bitstream/**/*.{ts,tsx,js,jsx}",
    // Panel HTML template (Tailwind classes in TernionToolsPanel etc.)
    "./src/panels/**/*.ts",
    // T3D library from npm package (published package includes src/T3D/** and dist)
    resolveGlob("node_modules/@ternion/t3d/src/T3D/ui/**/*.{ts,tsx}"),
    // Quick scenes + applications (e.g. Welcome page) live outside /ui
    resolveGlob("node_modules/@ternion/t3d/src/T3D/applications/**/*.{ts,tsx}"),
    resolveGlob("node_modules/@ternion/t3d/src/T3D/quick-scene/**/*.{ts,tsx}"),
    // Built JS may contain class strings (keep broad to avoid missing utilities)
    resolveGlob("node_modules/@ternion/t3d/dist/*.{js,mjs}"),
    resolveGlob("node_modules/@ternion/t3d/dist/ui.es.js"),
  ],
  safelist: [
    "bg-gray-800/90",
    "bg-gray-800/50",
    "bg-gradient-to-br",
    "from-gray-900/70",
    "via-black/40",
    "to-gray-900/70",
    "backdrop-blur-md",
    "backdrop-blur-xl",
    "bg-white/10",
    "text-gray-400",
    "text-white",
    "bg-red-500",
    "bg-blue-500",
    "border-white/10",
    "ring-1",
    "ring-white/5",
    {
      pattern: /(hover|focus):bg-white\/10/,
    },
    {
      pattern: /hover:text-white/,
    },
  ],
  darkMode: "class",
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
    },
  },
  plugins: [],
};
