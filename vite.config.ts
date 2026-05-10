import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@hextools/renderer": resolve(
        import.meta.dirname,
        "./packages/@hextools/renderer/src",
      ),
    },
  },
  server: {
    allowedHosts: true,
  },
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
  ],
});
