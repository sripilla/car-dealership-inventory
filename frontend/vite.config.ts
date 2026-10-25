/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    // jsdom gives tests a fake browser (document, window) so components can render.
    environment: 'jsdom',
    // Lets tests use test() and expect() without importing them in every file.
    globals: true,
    // Runs before every test file.
    setupFiles: './src/test/setup.ts',
    // A fixed API address for tests, so they never depend on your local .env
    // (which isn't committed) and never reach the real backend.
    env: { VITE_API_URL: 'http://api.test' },
  },
})
