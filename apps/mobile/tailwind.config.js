/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        "champagne-gold": "#C9A96E",
        champagne: "#F5E6D3",
        ivory: "#FDF8F5",
        blush: "#F4B8C1",
        sage: "#8FAF8F",
        navy: "#1B2B5E",
        "warm-gray": "#6B6560",
      },
    },
  },
  plugins: [],
}
