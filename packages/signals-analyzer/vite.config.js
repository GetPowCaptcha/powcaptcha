import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

import packageJson from './package.json';

const packageName = packageJson.name.split('/').pop() || packageJson.name;
const jsIdentifierName = packageName.replace(/[^a-zA-Z0-9_$]/g, '_');

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs', 'umd', 'iife'],
      name: jsIdentifierName,
      fileName: packageName,
    },
    rollupOptions: {
      external: [],
    },
  },

  plugins: [dts()],
});
