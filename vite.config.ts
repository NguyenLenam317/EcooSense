import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";

// Get the directory name in a way that works with ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Simplified plugin loading to avoid dynamic import issues
function getPlugins() {
  const basePlugins = [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
  ];
  
  return basePlugins;
}

export default defineConfig({
  plugins: getPlugins(),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "client", "index.html"),
      },
    },
  },
  server: {
    port: 5000, // Changed to match the port in .replit file
    host: "0.0.0.0", // This ensures the server is accessible externally
    hmr: {
      clientPort: 443, // For Replit to handle WebSocket connections
      host: process.env.REPL_ID ? "${process.env.REPL_SLUG}.id.repl.co" : "localhost"
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: "globalThis",
      },
    },
    include: [
      "react",
      "react-dom",
      "@radix-ui/react-slot",
      "class-variance-authority",
      "clsx",
      "tailwind-merge",
      "tailwindcss-animate"
    ]
  }
});
