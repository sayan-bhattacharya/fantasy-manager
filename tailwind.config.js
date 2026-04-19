/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  important: "#__next",
  theme: {
    extend: {
      fontFamily: {
        jakarta: ['"Plus Jakarta Sans"', "sans-serif"],
        display: ['"Clash Display"', '"Plus Jakarta Sans"', "sans-serif"],
      },
      colors: {
        pitch: {
          50: "#f0fdf4",
          100: "#dcfce7",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          900: "#14532d",
        },
        neon: {
          green: "#00FF87",
          lime: "#ADFF2F",
          cyan: "#00E5FF",
        },
        dark: {
          950: "#030712",
          900: "#050505",
          800: "#0a0a0a",
          700: "#111111",
          600: "#1a1a1a",
          500: "#222222",
        },
      },
      backgroundImage: {
        "pitch-gradient":
          "radial-gradient(ellipse at 50% 0%, rgba(0,255,135,0.12) 0%, transparent 70%)",
        "card-shine":
          "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 60%)",
        "hero-mesh":
          "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0,255,135,0.15) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 50%, rgba(0,229,255,0.08) 0%, transparent 50%)",
      },
      animation: {
        "fade-up": "fadeUp 0.8s cubic-bezier(0.32,0.72,0,1) forwards",
        "fade-in": "fadeIn 0.6s cubic-bezier(0.32,0.72,0,1) forwards",
        "pulse-slow": "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
        float: "float 6s ease-in-out infinite",
        ticker: "ticker 30s linear infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(24px) blur(8px)" },
          "100%": { opacity: "1", transform: "translateY(0) blur(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.32, 0.72, 0, 1)",
        "spring-back": "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      boxShadow: {
        card: "0 0 0 1px rgba(255,255,255,0.06), 0 8px 40px rgba(0,0,0,0.4)",
        "card-hover":
          "0 0 0 1px rgba(0,255,135,0.3), 0 8px 60px rgba(0,255,135,0.1)",
        "neon-green":
          "0 0 20px rgba(0,255,135,0.4), 0 0 60px rgba(0,255,135,0.15)",
        "neon-sm": "0 0 8px rgba(0,255,135,0.5)",
        "inner-highlight": "inset 0 1px 1px rgba(255,255,255,0.1)",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
    },
  },
  plugins: [],
};
