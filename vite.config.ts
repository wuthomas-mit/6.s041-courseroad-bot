import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue2";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 8080,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    vue(),
  ],
  assetsInclude: ['**/*.txt'], // Include text files as static assets
  // Add specific handling for raw text imports
  build: {
    rollupOptions: {
      plugins: []
    }
  }
});
