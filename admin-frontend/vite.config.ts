import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/manage-app/",
  server: {
    proxy: {
      "/api": "http://127.0.0.1:8080",
      "/manage": "http://127.0.0.1:8080",
      "/pangbobo": "http://127.0.0.1:3000"
    }
  }
});
