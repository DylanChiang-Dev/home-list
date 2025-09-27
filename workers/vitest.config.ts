import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'miniflare',
    environmentOptions: {
      bindings: {
        JWT_SECRET: 'test-secret-key-for-development',
        ENVIRONMENT: 'test',
        CORS_ORIGIN: 'http://localhost:5173'
      },
      kvNamespaces: ['TEST_KV'],
      d1Databases: ['TEST_DB']
    },
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**'
      ]
    }
  },
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname
    }
  }
});