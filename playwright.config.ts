import { defineConfig } from '@playwright/test'

// BASE_URL=https://… npx playwright test   (default: a local `npm run preview`)
export default defineConfig({
  testDir: 'tests',
  testMatch: '*.spec.ts',
  timeout: 180_000,
  workers: 1,
  expect: { timeout: 10_000 },
  use: { actionTimeout: 15_000, baseURL: process.env.BASE_URL ?? 'http://localhost:4174', viewport: { width: 1440, height: 900 } },
})
