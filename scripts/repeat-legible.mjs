// Time to a legible h1 on a repeat (cached) visit: node scripts/repeat-legible.mjs <url> [mobile]
import { chromium } from '@playwright/test'
const [url, mobile] = process.argv.slice(2)
const b = await chromium.launch()
const ctx = await b.newContext(mobile ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1440, height: 900 } })
const p = await ctx.newPage()
const legible = async () => {
  const t0 = Date.now()
  await p.goto(url, { waitUntil: 'commit' })
  await p.waitForFunction(() => { const h = document.querySelector('h1'); if (!h) return false; const r = h.getBoundingClientRect(), s = getComputedStyle(h); return r.height > 0 && +s.opacity > 0.95 && s.visibility !== 'hidden' }, null, { polling: 20, timeout: 20000 })
  const poster = await p.evaluate(() => { const i = document.querySelector('.hero__poster'); return !i || (i.complete && i.naturalWidth > 0) })
  return { ms: Date.now() - t0, poster }
}
const first = await legible(); await p.waitForTimeout(4000)
const repeat = await legible()
console.log(JSON.stringify({ url, mobile: !!mobile, first, repeat }))
await b.close()
