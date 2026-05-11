import { resolve } from "node:path";
import { defineConfig } from "vite";

// https://vite.dev/guide/build#library-mode
export default defineConfig({
  build: {
    lib: {
      entry: Object.fromEntries(
        [
          ["index", "index.ts"],
          ["shaders", "shaders/index.ts"],
          ["staffGrid", "staffGrid/index.ts"],
        ].map(([name, path]) => [
          name,
          resolve(import.meta.dirname, "src", path),
        ]),
      ),
      formats: ["es", "cjs"],
    },
    rolldownOptions: {
      // All bare module IDs (not starting with `.` or `/` or `C:\`)
      // https://rolldown.rs/reference/InputOptions.external
      external: /^(?![a-zA-Z]:[/\\])[^./]/,
    },
  },
});
