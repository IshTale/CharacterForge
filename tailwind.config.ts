import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        blush: {
          50: "#fffafd",
          100: "#fff3f8",
          200: "#f7dce9",
          300: "#efbfd7"
        },
        mint: {
          50: "#f3fdff",
          100: "#e8fbfb",
          200: "#c9f5f6",
          300: "#9fe9ed",
          500: "#3fb7c7"
        },
        magenta: {
          400: "#f04aa7",
          500: "#db1f85",
          600: "#b9146c"
        },
        plum: {
          700: "#5a2448",
          800: "#421736",
          900: "#2b1025"
        },
        "canvas-headshot": "#5B8DEF",
        "canvas-fullbody": "#32C48D",
        "canvas-hand": "#F7B267",
        "canvas-feet": "#E76F51"
      }
    }
  },
  plugins: []
};

export default config;
