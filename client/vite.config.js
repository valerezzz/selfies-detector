import { defineConfig } from "vite";
import mkcert from "vite-plugin-mkcert";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    https: true,
    host: true,
    proxy: {
      "/api": {
        target: "https://localhost:5001",
        secure: false,
        changeOrigin: true,
      },
      "/socket.io": {
        target: "https://localhost:5001",
        secure: false,
        ws: true,
      },
    },
  },
  plugins: [mkcert()],
});
