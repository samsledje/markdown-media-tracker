/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      // Add custom line-height for better mobile readability
      lineHeight: {
        'mobile': '1.6',
      },
      // Add touch-friendly spacing
      spacing: {
        'touch': '44px', // Minimum touch target size
      },
    },
  },
  plugins: [],
}