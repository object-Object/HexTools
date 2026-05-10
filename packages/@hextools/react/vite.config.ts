import { resolve } from "node:path";
import { defineConfig } from "vite";

// https://vite.dev/guide/build#library-mode
export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(import.meta.dirname, "src/index.ts"),
      },
      formats: ["es", "cjs"],
    },
    rolldownOptions: {
      // All bare module IDs (not starting with `.` or `/` or `C:\`)
      // https://rolldown.rs/reference/InputOptions.external
      external: /^(?![a-zA-Z]:[/\\]|@hextools\/)[^./]/,
    },
  },
});
