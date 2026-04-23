import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#09090b",
        panel: "#111114",
        border: "#1f1f23",
        fg: "#ededef",
        muted: "#6b6b75",
        accent: "#ff4d00", // Kelvin orange — nod to a hot pool
        good: "#22c55e",
        bad: "#ef4444",
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
