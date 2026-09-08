import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    server: {
        host: '0.0.0.0',       // Agar bisa diakses dari IP jaringan PC Server
        port: 5173,            // Port unik khusus untuk eventcalender
        strictPort: true,      // Mencegah Vite loncat ke port lain jika bentrok
        cors: true,
        hmr: {
            host: '192.168.1.19', // IP PC Server
            port: 5173,
        },
    },
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/app.jsx',
            ],
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
});