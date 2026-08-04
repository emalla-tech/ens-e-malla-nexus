const config = {
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    theme: {
        extend: {
            colors: {
                brand: {
                    orange: '#ff7a1a',
                    black: '#111111',
                    gray: '#f4f5f7',
                    ink: '#222222',
                },
            },
            boxShadow: {
                premium: '0 20px 60px rgba(17, 17, 17, 0.08)',
            },
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
export default config;
