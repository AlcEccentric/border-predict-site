import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        watch: {
            usePolling: true,
        },
    },
    publicDir: 'normal',  // This makes the normal folder available at root
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});