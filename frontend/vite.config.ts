import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig(({ mode }) => {
  const isLib = mode === 'lib';

  return {
    plugins: [react()],
    server: {
      port: 5173,
    },
    build: isLib
      ? {
          outDir: 'dist-lib',
          emptyOutDir: true,
          lib: {
            entry: resolve(__dirname, 'src/lib-index.ts'),
            name: 'RutaCasinoUI',
            formats: ['es', 'cjs'],
            fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
          },
          rollupOptions: {
            external: ['react', 'react-dom', 'pixi.js'],
            output: {
              globals: {
                react: 'React',
                'react-dom': 'ReactDOM',
                'pixi.js': 'PIXI',
              },
            },
          },
        }
      : undefined,
  };
});
