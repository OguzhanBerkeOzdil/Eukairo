/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#34D399",
        "background-light": "#f6f6f8",
        "background-dark": "#101622",
        "card-light": "#FFFFFF",
        "card-dark": "#18242A",
        "text-light": "#1F2937",
        "text-dark": "#E5E7EB",
        "subtext-light": "#6B7280",
        "subtext-dark": "#9CA3AF",
        "chip-light-bg": "#E5E7EB",
        "chip-light-text": "#4B5563",
        "chip-dark-bg": "#374151",
        "chip-dark-text": "#D1D5DB",
        "button-bg-dark": "#1F2937",
        "button-bg-dark-hover": "#374151",
        "button-bg-dark-focus": "#4B5563",
        "button-bg-dark-disabled": "#111827",
        "text-dark-disabled": "#4B5563"
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: "Inter"
      },
      boxShadow: {
        'glow': '0 0 20px 0 rgba(52, 211, 153, 0.4)',
        'glow-subtle': '0 0 40px -10px rgba(52, 211, 153, 0.2)',
        'glow-subtle-hover': '0 0 50px -10px rgba(52, 211, 153, 0.4)',
      },
      animation: {
        'fade-in': 'fade-in 1s ease-out forwards',
        'pulse-slow': 'pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'fade-in': {
          'from': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'pulse-slow': {
          '0%, 100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
          '50%': {
            opacity: '0.5',
            transform: 'scale(0.95)',
          },
        },
      },
    },
  },
  plugins: [],
}
