import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

/**
 * StreamAvatar Vite Configuration
 * 
 * Optimized for:
 * - WebAssembly with threading support (MediaPipe)
 * - Large binary assets (.vrm, .glb)
 * - Three.js/VRM code splitting
 */
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    // Required headers for SharedArrayBuffer (WASM multi-threading)
    // Without these, MediaPipe's WASM workers may fail silently
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },

  // Preview server (npm run preview) also needs these headers
  preview: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },

  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // Include binary 3D assets in the build process
  assetsInclude: ['**/*.vrm', '**/*.glb', '**/*.gltf', '**/*.wasm'],

  // Optimization settings
  optimizeDeps: {
    // Don't pre-bundle WASM modules - they need special handling
    exclude: ['@mediapipe/tasks-vision'],
  },

  build: {
    // Increase chunk size warning limit for 3D assets
    chunkSizeWarningLimit: 1500,

    rollupOptions: {
      output: {
        // Code splitting for better caching
        manualChunks: {
          // Group Three.js and VRM together - they're always used together
          'three-vrm': ['three', '@pixiv/three-vrm'],
          // React Three Fiber ecosystem
          'r3f': ['@react-three/fiber', '@react-three/drei'],
          // UI components
          'ui': ['lucide-react', 'sonner'],
        },
      },
    },
  },
}));
