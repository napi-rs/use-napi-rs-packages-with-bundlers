import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";

import { Plugin, defineConfig } from "vite";
import builtinModules from "builtin-modules";

const ViteNodeAddonPlugin = (): Plugin => {
  return {
    name: "native-addon",
    apply: "build",
    enforce: "pre",
    async load(id) {
      if (id.endsWith(".node") && existsSync(id)) {
        const refId = this.emitFile({
          type: "asset",
          fileName: basename(id),
          source: await readFile(id),
        });
        const runtimePath = `./${this.getFileName(refId)}`;
        return (
          `const id = ${JSON.stringify(runtimePath)};` +
          `export default require(id);`
        );
      }
      return null;
    },
  };
};

export default defineConfig({
  resolve: {
    mainFields: ["module", "main"],
  },
  plugins: [ViteNodeAddonPlugin()],
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
