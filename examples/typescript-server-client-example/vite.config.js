import { defineConfig } from "vite";

const packageName = "server-client-example";

export default defineConfig({
  build: {
    lib: {
      entry: "src/main.ts",
      name: packageName,
      formats: ["es"],
      fileName: packageName,
    },
  },
});
