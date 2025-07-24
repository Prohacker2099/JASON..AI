/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#050b14",
        "text-primary": "#ffffff",
        "jason-sapphire": "#0ea5e9",
        "jason-electric": "#3b82f6",
        "jason-amber": "#f59e0b",
        surface: "#111827",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      boxShadow: {
        "glow-sm": "0 0 10px rgba(59, 130, 246, 0.5)",
        "glow-md": "0 0 20px rgba(59, 130, 246, 0.5)",
        "glow-lg": "0 0 30px rgba(59, 130, 246, 0.5)",
      },
    },
  },
  plugins: [],
};
