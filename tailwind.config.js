/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'custom-bg': "url('/src/assets/bg.jpg')",
        'flex-bg': "url('/src/assets/Box_1.png')",
        'button-bg': "url('/src/assets/wb.png')",
        'flex2-bg': "url('/src/assets/Box_2.png')",
        'form-bg':"URL('src/assets/text_box.png')"

      },

      fontFamily: {
        'inknut': ['"Inknut Antiqua"', 'serif'],
      },
      
      backgroundColor: {
        'navbar': '#3C3C3C',
      },

      colors: {
        beige: '#f5e6d3',
        'brown-300': '#8d6e63',
        // ... (keep other color definitions)
      },
    },
  },
  plugins: [],
}