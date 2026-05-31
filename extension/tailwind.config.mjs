/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/webview/**/*.{ts,tsx,js,jsx}",
    "./src/bitstream/**/*.{ts,tsx,js,jsx}",
    "./src/panels/**/*.ts",
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
      fontFamily: {
        sans: ["Inter", "Helvetica", "Arial", "sans-serif"],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
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
