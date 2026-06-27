/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./styles/**/*.css"
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: "hsl(var(--primary))",
        // ASG gold palette
        gold: {
          50:  "#FBF7EC",
          100: "#F5EDD0",
          200: "#EAD89F",
          300: "#DFC36E",
          400: "#D4A843",
          500: "#B8922A",
          600: "#967519",
          700: "#72580F",
          800: "#4E3C09",
          900: "#2A2004",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};