import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig(({ mode }) => {
  const isLib = mode === 'lib';
  const env = loadEnv(mode, process.cwd(), '');
  const cdnBase = env.VITE_CDN_BASE_URL?.trim();
  const appBase = cdnBase
    ? cdnBase.endsWith('/')
      ? cdnBase
      : `${cdnBase}/`
    : '/';

  return {
    plugins: [react()],
    base: isLib ? '/' : appBase,
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
      : {
          outDir: 'dist',
          emptyOutDir: true,
          manifest: true,
        },
  };
});
