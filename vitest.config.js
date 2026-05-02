import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/tests/**/*.test.js'],
    setupFiles: ['./src/tests/setup.js'],
    testTimeout: 30000,
  },
})
