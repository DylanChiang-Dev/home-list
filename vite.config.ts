import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { compression } from 'vite-plugin-compression2';

// https://vite.dev/config/
export default defineConfig({
  build: {
    sourcemap: 'hidden',
    // 代码分割优化
    rollupOptions: {
      output: {
        manualChunks: {
          // 将 React 相关库打包到单独的 chunk
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // 图标库单独打包
          'lucide': ['lucide-react'],
        },
      },
    },
    // 压缩优化
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 生产环境移除 console
        drop_debugger: true,
      },
    },
    // chunk 大小警告阈值
    chunkSizeWarningLimit: 1000,
  },
  plugins: [
    react({
      babel: {
        plugins: [
          'react-dev-locator',
        ],
      },
    }),

    tsconfigPaths(),

    // Gzip 压缩
    compression({
      algorithm: 'gzip',
      threshold: 10240, // 大于 10KB 才压缩
    }),
    // Brotli 压缩 (更好的压缩率)
    compression({
      algorithm: 'brotliCompress',
      threshold: 10240,
    }),
  ],
  // 服务器配置
  server: {
    port: 5173,
    strictPort: false,
    host: true,
  },
  // 预览服务器配置
  preview: {
    port: 4173,
    strictPort: false,
    host: true,
  },
})
