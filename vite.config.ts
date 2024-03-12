import { existsSync } from "node:fs";
import { readFile, writeFile, copyFile } from "node:fs/promises";
import { basename, extname, sep, dirname, posix } from "node:path";
import crypto from "node:crypto";

import { Plugin, defineConfig } from "vite";
import builtinModules from "builtin-modules";

const fileName = "[hash][extname]";

const ViteNodeAddonPlugin = (): Plugin => {
  const files = new Map<string, string>();
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
    async generateBundle(outputOptions) {
      for (const [input, output] of files) {
        await copyFile(input, `${outputOptions.dir}/${output}`);
        await writeFile(
          `${outputOptions.dir}/${output}.js`,
          `let binding = { exports: { } }; process.dlopen(binding, new URL('${output}', import.meta.url).pathname); export default binding.exports;`
        );
      }
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
