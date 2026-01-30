/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    dark: '#0f172a',
                    accent: '#10b981', // Emerald green for "money/success"
                    danger: '#ef4444',
                    warning: '#f59e0b',
                }
            }
        },
    },
    plugins: [],
}
