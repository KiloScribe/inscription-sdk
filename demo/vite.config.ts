import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
    root: '.',
    server: {
        port: 3000,
    },
    build: {
        outDir: '../dist/demo',
        emptyOutDir: true,
    },
    plugins: [
        nodePolyfills({
            include: ['buffer', 'process', 'util', 'stream'],
            globals: {
                Buffer: true,
                global: true,
                process: true,
            },
        }),
    ],
    optimizeDeps: {
        include: ['@hashgraphonline/hashinal-wc', '@kiloscribe/inscription-sdk'],
    },
});
