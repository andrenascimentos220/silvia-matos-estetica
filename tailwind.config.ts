import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // 'cinzel' continua sendo a decorativa (para o MATOS)
        cinzel: ["var(--font-cinzel)", "serif"], 
        // NOVA: 'cinzel-standard' é a clássica reta (para o SILVIA)
        "cinzel-standard": ["var(--font-cinzel-standard)", "serif"],
        lato: ["var(--font-lato)", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;