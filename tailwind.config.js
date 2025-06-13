/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts}"],
  theme: {
    extend: {
      animation: {
        'spin-11s': 'spin 11s linear infinite',
      },
    },
  },
  plugins: [],
};