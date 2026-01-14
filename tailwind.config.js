/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#0E0F13',
                card: '#161821',
                primary: {
                    DEFAULT: '#3B82F6', // Blue Action
                    foreground: '#FFFFFF',
                },
                success: '#10B981',
                warning: '#F59E0B',
                destructive: '#EF4444',
                muted: {
                    DEFAULT: '#1F2937',
                    foreground: '#9CA3AF',
                },
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            borderRadius: {
                '2xl': '1rem',
            },
        },
    },
    plugins: [],
}
