import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
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
