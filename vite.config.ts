import { defineConfig, LibraryFormats } from 'vite';
import path from 'path';
import StringReplace from 'vite-plugin-string-replace';
import dts from 'vite-plugin-dts';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig(({ mode }) => {
  const format = (process.env.BUILD_FORMAT || 'es') as LibraryFormats;
  const outputDir = format === 'umd' ? 'dist/umd' : 'dist/es';
  const isEsm = format === 'es';

  const externalDependencies = [
    '@hashgraph/proto',
    '@hashgraph/sdk',
    'fetch-retry',
  ];

  const plugins = [
    StringReplace([
      {
        search: 'VITE_BUILD_FORMAT',
        replace: format,
      },
    ]),
    dts({
      insertTypesEntry: true,
      include: ['src/**/*.ts'],
      outDir: outputDir,
    }),
    nodePolyfills(),
  ];

  return {
    plugins: plugins as any,
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
      minify: 'terser',
      sourcemap: true,
    },
    define: {
      VITE_BUILD_FORMAT: JSON.stringify(format),
    },
    resolve: {
      alias: {
        util: 'util',
      },
    },
    ssr: {
      external: externalDependencies,
    },
  };
}) as any;
