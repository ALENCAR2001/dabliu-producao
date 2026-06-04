/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      minHeight: {
        screen: '100dvh',
        app: '100dvh',
      },
      height: {
        screen: '100dvh',
        app: '100dvh',
      },
      padding: {
        safe: 'env(safe-area-inset-bottom, 0px)',
        'safe-top': 'env(safe-area-inset-top, 0px)',
        'safe-x': 'max(env(safe-area-inset-left, 0px), env(safe-area-inset-right, 0px))',
      },
    },
  },
  plugins: [],
}