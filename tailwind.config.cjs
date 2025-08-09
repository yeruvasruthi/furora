
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { ivory:'#F8F4F0', taupe:'#D8C3A5', olive:'#7C8A6A', terracotta:'#C98B6B', charcoal:'#333333', softtext:'#6E6E6E' },
      borderRadius: { card: '14px' },
      boxShadow: { soft: '0 10px 30px rgba(0,0,0,0.06)' },
    },
    fontFamily: { heading:['Fraunces','serif'], body:['Inter','system-ui','sans-serif'] }
  },
  plugins: [],
}
