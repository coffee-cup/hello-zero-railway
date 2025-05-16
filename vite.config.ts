import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 5678,
    proxy: {
      "/api": {
        target: "http://localhost:6789",
        changeOrigin: true,
      },
    },
  },
  plugins: [react(), tailwindcss()],
});
