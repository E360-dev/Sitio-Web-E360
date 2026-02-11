/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      animation: {
        'spin-11s': 'spin 11s linear infinite',
      },
      colors: {
        e360: {
          primary: '#2e527f',
          light: '#7fa1c7',
          dark: '#1e3a5f',
          accent: '#365e91', // Nuevo color para el botón de login
          'text-dark': '#867A5B', // Nuevo color para el texto de las páginas
          cyan: '#25c6e3', // Nuevo color para el degradado del botón
          highlight: '#e80554', // Nuevo color para hover/active en el navbar
        }
      },
      fontFamily: {
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui']
      },
      boxShadow: {
        'rb-md': '8px 8px 16px rgba(0, 0, 0, 0.3)',
        'rb-lg': '12px 12px 25px rgba(0, 0, 0, 0.4)',
      }
    }
  },
  plugins: []
}
