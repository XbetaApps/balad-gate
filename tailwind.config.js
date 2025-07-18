/** @type {import('tailwindcss').Config} */
module.exports = {
  // ░░ الوضع الليلي (بتفعيل صنف `dark` على <html>) ░░
  darkMode: 'class',

  // ░░ الملفات التي يفحصها Tailwind لاكتشاف الفئات ░░
  // أضف أو احذف حسب هيكل مشروعك.
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  theme: {
    extend: {
      /* ---------------- ألوان مخصَّصة للهوية ---------------- */
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: 'var(--card)',
        border: 'var(--border)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        muted: 'var(--muted)',
        'brand-amber': {
          DEFAULT: '#d4af37', // الذهبي المستخدم في التصميم
          50: '#fffbec',
          100: '#fff3d0',
          200: '#ffe082',
          300: '#ffd600',
          400: '#ffca28',
          500: '#ffd700',
          600: '#c09e26',
          700: '#a8861a',
          800: '#90700e',
          900: '#785a0b',
        },
        gold: {
          50: '#fff8e5',
          100: '#fff3cc',
          200: '#ffe082',
          300: '#ffd600',
          400: '#ffca28',
          500: '#ffd700',
          600: '#c09e26',
          700: '#a8861a',
          800: '#90700e',
          900: '#785a0b',
        },
        black: {
          50: '#121212',
          100: '#1e1e1e',
          200: '#2d2d2d',
          300: '#333333',
          400: '#404040',
          500: '#505050',
          600: '#606060',
          700: '#707070',
          800: '#808080',
          900: '#909090',
        },
        blue: {
          50: '#e3f2fd',
          100: '#bbdefb',
          200: '#90caf9',
          300: '#64b5f6',
          400: '#42a5f5',
          500: '#2196f3',
          600: '#1e88e5',
          700: '#1976d2',
          800: '#1565c0',
          900: '#0d47a1',
        },
      },

      /* ---------------- خطوط عربية ---------------- */
      fontFamily: {
        tajawal: ['Tajawal', 'Amiri', 'serif'],
      },
    },
  },

  /* ---------------- إضافات مفيدة ---------------- */
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
  ],
};
