import { defineConfig } from 'vite';
import path from 'path';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import dts from 'vite-plugin-dts';

export default defineConfig(({ mode }) => {
  const format = process.env.BUILD_FORMAT || 'es';
  const outputDir = format === 'umd' ? 'dist/umd' : 'dist/es';
  const isEsm = format === 'es';

  const externalDependencies = [
    '@hashgraph/proto',
    '@hashgraph/sdk',
    'fetch-retry',
  ];

  const plugins = [
    nodePolyfills(),
    dts({
      insertTypesEntry: true,
      include: ['src/**/*.ts'],
      outputDir: outputDir,
    }),
  ];

  return {
    plugins,
    build: {
      outDir: outputDir,
      lib: {
        entry: path.resolve(__dirname, 'src/index.ts'),
        name: 'InscriptionSDK',
        fileName: (format) => `inscription-sdk.${format}.js`,
        formats: [format],
      },
      rollupOptions: {
        external: format === 'es' ? externalDependencies : [],
        output: {
          globals: (id) => id,
        },
      },
      commonjsOptions: {
        include: [/node_modules/],
      },
      minify: 'terser',
      sourcemap: true,
    },
    define: {
      VITE_BUILD_FORMAT: JSON.stringify(format),
    },
    resolve: {
      alias: {
        process: 'process/browser',
        stream: 'stream-browserify',
        zlib: 'browserify-zlib',
        util: 'util',
      },
    },
    ssr: {
      external: externalDependencies,
    },
  };
});
