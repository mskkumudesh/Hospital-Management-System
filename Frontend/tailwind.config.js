export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#13262b',
        sea: { DEFAULT: '#0f6b6b', dark: '#0b4f50', soft: '#dcebe8' },
        paper: '#f3f6f4',
        alert: '#b4400f',
      },
      fontFamily: { sans: ['"Instrument Sans"', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
