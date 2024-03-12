import { defineConfig } from "vite";
import builtinModules from "builtin-modules";

export default defineConfig({
  resolve: {
    mainFields: ["module", "main"],
  },
  assetsInclude: ["**/*.node"],
  build: {
    rollupOptions: {
      input: "./src/index.js",
      output: {
        format: "cjs",
        entryFileNames: "vite.cjs",
      },
    },
    target: "esnext",
    ssr: true,
    ssrEmitAssets: true,
  },
  ssr: {
    external: builtinModules as string[],
    noExternal: true,
  },
});
