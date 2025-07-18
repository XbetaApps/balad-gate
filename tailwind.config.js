/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Custom colors
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
        background: 'rgb(var(--color-background) / <alpha-value>)',
        text: 'rgb(var(--color-text) / <alpha-value>)',
        card: 'rgb(var(--color-card) / <alpha-value>)',
        'card-border': 'rgb(var(--color-card-border) / <alpha-value>)',
        'card-text': 'rgb(var(--color-card-text) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-tajawal)', 'sans-serif'],
        serif: ['var(--font-amiri)', 'serif'],
      },
      transitionProperty: {
        'colors': 'background-color, border-color, color, box-shadow',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
