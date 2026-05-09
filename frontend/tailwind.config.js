/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          bg:    "#070711",
          card:  "#0f0f1a",
          deep:  "#1a1a2e",
        },
      },
      animation: {
        marquee:  "marquee 30s linear infinite",
        marquee2: "marquee2 30s linear infinite",
        "fade-up": "fadeUp 0.6s ease-out forwards",
      },
      keyframes: {
        marquee:  { "0%": { transform: "translateX(0%)" },   "100%": { transform: "translateX(-100%)" } },
        marquee2: { "0%": { transform: "translateX(100%)" }, "100%": { transform: "translateX(0%)" } },
        fadeUp:   { "0%": { opacity: "0", transform: "translateY(20px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
      },
    },
  },
  plugins: [],
};
