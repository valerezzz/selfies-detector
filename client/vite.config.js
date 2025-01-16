import { defineConfig } from "vite";
import mkcert from "vite-plugin-mkcert";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    https: true,
    host: true,
    proxy: {
      "/api": {
        target: "https://192.168.1.111:5001",
        secure: false,
        changeOrigin: true,
      },
      "/images": {
        target: "https://192.168.1.111:5001",
        secure: false,
        changeOrigin: true,
      },
      "/socket.io": {
        target: "https://192.168.1.111:5001",
        secure: false,
        ws: true,
      },
    },
  },
  plugins: [mkcert()],
});
