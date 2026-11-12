// Screenshots of the hero at fixed scroll positions (progress through the scrub): node scripts/hero-check.mjs <base> <out>
import { chromium } from '@playwright/test'
const [base, out] = process.argv.slice(2)
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
await p.goto(base + '/'); await p.waitForTimeout(5000)
for (const vh of [0.3, 0.75, 0.85, 1.2, 1.6, 2.0]) {
  await p.evaluate((y) => window.scrollTo(0, y), vh * 900); await p.waitForTimeout(900)
  await p.screenshot({ path: `${out}/hero-${vh}.jpg`, quality: 70 })
}
await b.close()
