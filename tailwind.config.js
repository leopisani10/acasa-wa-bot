/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Poppins', 'system-ui', 'sans-serif'],
        'archivo-black': ['Archivo Black', 'sans-serif'],
        'anton': ['Anton', 'sans-serif'],
      },
      colors: {
        'acasa': {
          'purple': '#8B2C8A',
          'red': '#DC2626',
          'black': '#1F2937',
        }
      }
    },
  },
  plugins: [],
};
