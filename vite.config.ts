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
    async load(p) {
      if (p.endsWith(".node")) {
        const data = await readFile(p);
        const hash = crypto
          .createHash("sha1")
          .update(data)
          .digest("hex")
          .substring(0, 16);
        const ext = extname(p);
        const name = basename(p, ext);
        const relativeDir = dirname(p).split(sep).pop();
        const outputFileName = fileName
          .replace(/\[hash\]/g, hash)
          .replace(/\[extname\]/g, ext)
          // use `sep` for windows environments
          .replace(
            /\[dirname\]/g,
            relativeDir === "" ? "" : `${relativeDir}${sep}`
          )
          .replace(/\[name\]/g, name);
        // Windows fix - exports must be in unix format
        const filename = `${outputFileName.split(sep).join(posix.sep)}`;
        files.set(p, filename);
        return `let binding = { exports: { } }; process.dlopen(binding, new URL('${filename}', import.meta.url).pathname); export default binding.exports;`;
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
        format: "esm",
        entryFileNames: "vite.js",
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
