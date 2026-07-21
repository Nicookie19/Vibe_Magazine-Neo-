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
        pastelBlue: '#A7C7E7',
        pastelPink: '#F7C6C7',
        pastelGreen: '#C9E4C5',
      },
    },
  },
  plugins: [lineClamp],
};
