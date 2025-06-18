/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      animation: {
        'spin-11s': 'spin 11s linear infinite',
      },
    },
  },
  plugins: [],
};