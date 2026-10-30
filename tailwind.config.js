/** @type {import('tailwindcss').Config} */
import lineClamp from '@tailwindcss/line-clamp';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#effcfc', 100: '#d6f5f6', 200: '#a4e3e7', 300: '#7dd5dc',
          400: '#60c5ce', 500: '#39a8b3', 600: '#217782',
          700: '#1b6069', 800: '#17474e', 900: '#112e34', 950: '#091c20',
        },
        pastelBlue: '#A7C7E7',
        pastelPink: '#F7C6C7',
        pastelGreen: '#C9E4C5',
      },
    },
  },
  plugins: [lineClamp],
};
