/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // support dark mode toggles via class="dark"
  theme: {
    extend: {
      colors: {
        // Map original CSS variables to Tailwind colors
        bgPrimary: 'var(--bg-primary)',
        bgSecondary: 'var(--bg-secondary)',
        borderCool: 'var(--border-color)',
        textPrimary: 'var(--text-primary)',
        textSecondary: 'var(--text-secondary)',
        textMuted: 'var(--text-muted)',
        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          light: 'var(--primary-light)',
        },
        success: {
          DEFAULT: 'var(--success)',
          light: 'var(--success-light)',
          text: 'var(--success-text)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          light: 'var(--warning-light)',
          text: 'var(--warning-text)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          light: 'var(--danger-light)',
          text: 'var(--danger-text)',
        },
        purple: {
          DEFAULT: 'var(--purple)',
          light: 'var(--purple-light)',
          text: 'var(--purple-text)',
        }
      },
      fontFamily: {
        body: ['Inter', 'sans-serif'],
        title: ['Outfit', 'sans-serif'],
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '10px',
        lg: '16px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0, 0, 0, 0.05)',
        md: '0 4px 12px rgba(15, 23, 42, 0.02), 0 1px 2px rgba(15, 23, 42, 0.01)',
        lg: '0 10px 30px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.02)',
      }
    },
  },
  plugins: [],
}
