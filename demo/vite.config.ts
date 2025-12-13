import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const demoRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    root: demoRoot,
    server: {
        port: 3000,
    },
    build: {
        outDir: resolve(demoRoot, '../dist/demo'),
        emptyOutDir: true,
    },
    plugins: [
        nodePolyfills({
            include: ['buffer', 'process', 'util', 'stream', 'crypto', 'path'],
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
