import { test, type Page } from '@playwright/test'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

// Brief §10: scripted full scroll at 4× CPU throttle (the source repo's test:scroll pattern): rAF frame times and long
// tasks. Two runs per page: a reader's slow wheel scroll (1200 px/s), and a fast one (3-viewport flings, then End).
//   BASE_URL=… PERF_PATHS=/,/story#ocean REPORT=perf-report.json npx playwright test tests/scroll-perf.spec.ts
const REPORT = process.env.REPORT ?? 'perf-report.json'
const PATHS = (process.env.PERF_PATHS ?? '/').split(',')

async function measure(page: Page, run: () => Promise<void>) {
  await page.evaluate(() => {
    const w = window as unknown as { __p: { long: number[]; frames: number[]; run: boolean } }
    w.__p = { long: [], frames: [], run: true }
    new PerformanceObserver((l) => l.getEntries().forEach((e) => w.__p.long.push(e.duration))).observe({ type: 'longtask' })
    let last = performance.now()
    const f = (t: number) => {
      w.__p.frames.push(t - last)
      last = t
      if (w.__p.run) requestAnimationFrame(f)
    }
    requestAnimationFrame(f)
  })
  await run()
  return page.evaluate(() => {
    const w = window as unknown as { __p: { long: number[]; frames: number[]; run: boolean } }
    w.__p.run = false
    const fr = w.__p.frames.slice(5).sort((a, b) => a - b)
    const avg = fr.reduce((a, b) => a + b, 0) / fr.length
    return {
      frames: fr.length,
      avgFps: +(1000 / avg).toFixed(1),
      p95FrameMs: +fr[Math.floor(fr.length * 0.95)].toFixed(1),
      longTasks: w.__p.long.length,
      maxLongTaskMs: +Math.max(0, ...w.__p.long).toFixed(0),
    }
  })
}

const left = (page: Page) => page.evaluate(() => document.documentElement.scrollHeight - innerHeight - scrollY)

for (const path of PATHS) {
  for (const mode of ['slow', 'fast'] as const) {
    test(`scroll perf ${path} ${mode}`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
      const page = await ctx.newPage()
      await page.goto(path, { waitUntil: 'load' })
      await page.waitForTimeout(4000) // let the hero sequence and fonts arrive, as a reader would
      const cdp = await ctx.newCDPSession(page)
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
      await page.mouse.move(700, 450)
      const r = await measure(page, async () => {
        if (mode === 'slow') {
          for (let n = 0; n < 3000 && (n % 5 || (await left(page)) > 2); n++) {
            await page.mouse.wheel(0, 60)
            await page.waitForTimeout(50)
          }
        } else {
          for (let i = 0; i < 6; i++) {
            await page.mouse.wheel(0, 900 * 3)
            await page.waitForTimeout(600)
          }
          await page.keyboard.press('End')
          await page.waitForTimeout(1500)
        }
        await page.waitForTimeout(500)
      })
      await ctx.close()
      const all = existsSync(REPORT) ? JSON.parse(readFileSync(REPORT, 'utf8')) : {}
      all[`${path} ${mode}`] = r
      writeFileSync(REPORT, JSON.stringify(all, null, 2))
      console.log(path, mode, JSON.stringify(r))
    })
  }
}
