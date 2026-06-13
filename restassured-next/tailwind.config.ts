import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0b1020",
        bg2: "#121935",
        panel: "#161d3d",
        panel2: "#1d2654",
        accent: "#7c5cff",
        accent2: "#3ddc97",
        muted: "#9aa6d1",
        border: "#2a3470",
      },
      fontFamily: {
        mono: ["Consolas", "Monaco", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.35s ease",
        spin: "spin 1s linear infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
