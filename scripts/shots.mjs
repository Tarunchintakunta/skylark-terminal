// Screenshots + transfer sizes for the comparison report.
//   node scripts/shots.mjs <baseUrl> <outDir> <path>[,<path>...]
// For every path and both viewports: hero (top), mid (50 %), builder (#builder, else 75 %), footer (End).
// Also writes <outDir>/metrics.json: bytes before the first legible h1, bytes after a full scroll, time to legible h1.
import { chromium } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'

const [base, out, paths = '/'] = process.argv.slice(2)
mkdirSync(out, { recursive: true })
const VIEWPORTS = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } }
const metrics = []
const browser = await chromium.launch()
for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
  for (const path of paths.split(',')) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile, hasTouch: vp.hasTouch, deviceScaleFactor: vp.deviceScaleFactor ?? 1 })
    const page = await ctx.newPage()
    const cdp = await ctx.newCDPSession(page)
    await cdp.send('Network.enable')
    let bytes = 0, files = 0
    cdp.on('Network.loadingFinished', (e) => { bytes += e.encodedDataLength; files++ })
    const t0 = Date.now()
    await page.goto(base + path, { waitUntil: 'commit' })
    // legible = an h1 with text, visible, opacity 1, in the viewport
    let legible = null
    try {
      await page.waitForFunction(() => {
        const h = [...document.querySelectorAll('h1')].find((e) => e.textContent?.trim())
        if (!h) return false
        const r = h.getBoundingClientRect(), s = getComputedStyle(h)
        return r.height > 0 && r.top < innerHeight && s.visibility !== 'hidden' && +s.opacity > 0.95
      }, null, { timeout: 15000, polling: 50 })
      legible = Date.now() - t0
    } catch {}
    await page.waitForTimeout(2500)
    const initial = bytes
    const slug = (path.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home') + '-' + vpName
    await page.screenshot({ path: `${out}/${slug}-hero.jpg`, quality: 78 })
    const H = await page.evaluate(() => document.documentElement.scrollHeight)
    // slow scroll through the whole page so lazy media loads, like a reader
    for (let y = 0; y < H; y += vp.height * 0.8) { await page.mouse.wheel(0, vp.height * 0.8); await page.waitForTimeout(250) }
    await page.waitForTimeout(1500)
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight / 2)); await page.waitForTimeout(1200)
    await page.screenshot({ path: `${out}/${slug}-mid.jpg`, quality: 78 })
    const hasBuilder = await page.evaluate(() => { const b = document.querySelector('#builder'); if (b) b.scrollIntoView(); return !!b })
    if (!hasBuilder) await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight * 0.75))
    await page.waitForTimeout(1200)
    await page.screenshot({ path: `${out}/${slug}-builder.jpg`, quality: 78 })
    await page.keyboard.press('End'); await page.waitForTimeout(400)
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await page.waitForTimeout(300)
    await page.screenshot({ path: `${out}/${slug}-footer.jpg`, quality: 78 })
    metrics.push({ path, viewport: vpName, legibleH1Ms: legible, initialMB: +(initial / 1e6).toFixed(2), fullScrollMB: +(bytes / 1e6).toFixed(2), requests: files, pageHeightPx: H })
    console.log(JSON.stringify(metrics.at(-1)))
    await ctx.close()
  }
}
await browser.close()
writeFileSync(`${out}/metrics.json`, JSON.stringify(metrics, null, 2))
