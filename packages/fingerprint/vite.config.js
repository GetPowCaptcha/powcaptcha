import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

import packageJson from "./package.json";

const packageName = packageJson.name.split("/").pop() || packageJson.name;

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es", "cjs", "umd", "iife"],
      name: packageName,
      fileName: packageName,
    },
    rollupOptions: {
      external: [],
    },
  },

  plugins: [dts({ rollupTypes: true })],
});
