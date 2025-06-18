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
        }
      },
      fontFamily: {
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui']
      }
    }
  },
  plugins: []
}