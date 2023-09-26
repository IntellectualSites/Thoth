/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{vue,js,ts}",
    ],
    theme: {
        extend: {
            colors: {
                'is-red': '#7b1648',
                'is-red-darker': '#68113c'
            }
        },
    },
    plugins: [],
}

