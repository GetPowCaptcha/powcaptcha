import { defineConfig } from 'vite';
import { resolve } from 'path';

import packageJson from './package.json';

const packageName = packageJson.name.split('/').pop() || packageJson.name;

const packagesDir = resolve(__dirname, '..');

const alias = [
  {
    find: '@powcaptcha/core',
    replacement: resolve(packagesDir, 'core', 'src'),
  },
  {
    find: '@powcaptcha/crypto',
    replacement: resolve(packagesDir, 'crypto', 'src'),
  },
  {
    find: '@powcaptcha/fingerprint',
    replacement: resolve(packagesDir, 'fingerprint', 'src'),
  },
  {
    find: '@powcaptcha/signals',
    replacement: resolve(packagesDir, 'signals', 'src'),
  },
];

export default defineConfig(({ mode }) => ({
  resolve: { alias },
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs', 'umd', 'iife'],
      name: packageName,
      fileName: packageName,
    },
    minify: 'terser',
  },
  plugins: [],
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
}));
