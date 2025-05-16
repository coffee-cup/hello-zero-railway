import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: "src/web",
  server: {
    port: 5678,
    proxy: {
      "/api": {
        target: "http://localhost:6789",
        changeOrigin: true,
      },
    },
  },
  plugins: [react()],
});
