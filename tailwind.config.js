/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      'cupcake',
      'dim',
      {
        'yueni-may': {
          'primary': '#D98452',
          'secondary': '#8C7288',
          'accent': '#D9B26A',
          'base-100': '#F2F2F2',
          'base-content': '#161526',
        },
      },
      {
        'yueni-may-dark': {
          'primary': '#E89F6E',
          'secondary': '#A98FA5',
          'accent': '#E5BF82',
          'base-100': '#161526',
          'base-content': '#F2F2F2',
        },
      },
    ],
  }
}
