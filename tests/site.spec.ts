import { expect, test } from '@playwright/test'

// Correctness gates: one footer everywhere, no console errors or 404s, builder → quote pre-fill, mailto fallback,
// header clearance, bottom-jump visibility, reduced motion. Runs against BASE_URL (preview or production).
const ROUTES = ['/', '/quote', '/order', '/404.html']

test('zero console errors and zero failed requests on every route', async ({ page }) => {
  const bad: string[] = []
  page.on('console', (m) => m.type() === 'error' && bad.push(`console: ${m.text()}`))
  page.on('pageerror', (e) => bad.push(`pageerror: ${e.message}`))
  page.on('response', (r) => r.status() >= 400 && !r.url().endsWith('/404.html') && bad.push(`${r.status()} ${r.url()}`))
  for (const r of ROUTES) {
    await page.goto(r, { waitUntil: 'networkidle' })
    if (r === '/') {
      // walk the page and open every chain tab, so lazy stills and the globe load too
      await page.locator('#chain').scrollIntoViewIfNeeded()
      for (const t of await page.getByRole('tab').all()) await t.click()
      await page.waitForTimeout(1500)
      await page.keyboard.press('End')
      await page.waitForTimeout(1500)
    }
  }
  expect(bad).toEqual([])
})

test('the footer is identical on every page and visible on a jump to the bottom', async ({ page }) => {
  const texts: string[] = []
  for (const r of ROUTES) {
    await page.goto(r)
    await page.locator('footer.site-foot').waitFor({ state: 'attached' })
    await page.keyboard.press('End')
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight))
    const f = page.locator('footer.site-foot')
    await expect(f).toBeInViewport({ ratio: 0.2 })
    expect(await f.evaluate((e) => getComputedStyle(e).opacity)).toBe('1')
    texts.push((await f.innerText()).replace(/\s+/g, ' ').trim())
    for (const link of ['Company profile (PDF)', 'Request export quote', 'Place an order']) await expect(f.getByRole('link', { name: link })).toBeVisible()
  }
  expect(new Set(texts).size, texts.join('\n---\n')).toBe(1)
})

test('builder CTA pre-fills /quote, and the form falls back to mailto without env vars', async ({ page }) => {
  await page.goto('/#builder')
  const b = page.locator('#builder')
  await b.getByLabel('Product').selectOption('Black Tiger Shrimp')
  await b.getByLabel('Form').selectOption('Easy Peel')
  await b.getByRole('spinbutton').fill('60')
  await b.getByRole('spinbutton').blur()
  await b.getByLabel('Destination market').selectOption('Kuwait')
  await b.getByRole('radio', { name: 'Chilled' }).check()
  await expect(b.locator('.out__big b')).toHaveText('3')
  await expect(b).toContainText('Shipped in reefer containers to maintain the cold chain from Anandapuram to Kuwait.')
  await expect(b.getByText('Indicative — confirmed on quote.').first()).toBeVisible()
  await b.getByRole('link', { name: 'Request export quote' }).click()
  await expect(page).toHaveURL(/\/quote#/)
  await expect(page.getByLabel('Black Tiger Shrimp')).toBeChecked()
  await expect(page.getByLabel('Easy Peel')).toBeChecked()
  await expect(page.getByLabel('Chilled')).toBeChecked()
  await expect(page.getByLabel('Quantity')).toHaveValue('60 MT')
  await expect(page.getByLabel('Destination market')).toHaveValue('Kuwait')
  // without RESEND_API_KEY the API answers {fallback: 'mailto'}; locally there is no API at all: both end in mailto
  await page.getByLabel('Name', { exact: true }).fill('Test Buyer')
  await page.getByLabel('Company', { exact: true }).fill('Test Co')
  await page.getByLabel('Country', { exact: true }).fill('Kuwait')
  await page.getByLabel('Email', { exact: true }).fill('buyer@example.com')
  await page.getByRole('button', { name: 'Send request' }).click()
  await expect(page.getByText('Your email app should open with the request.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'open the pre-filled email' })).toHaveAttribute('href', /^mailto:info@skylarkexim\.com\?subject=/)
})

test('pill header never covers a section heading at its anchor, at 5 depths', async ({ page }) => {
  for (const id of ['markets', 'chain', 'builder', 'products', 'faq']) {
    await page.goto(`/#${id}`)
    await page.waitForTimeout(400)
    const head = await page.locator('.site-head__bar').boundingBox()
    const h2 = await page.locator(`#${id} h2`).boundingBox()
    expect(h2!.y, id).toBeGreaterThan(head!.y + head!.height + 8)
  }
})

test('hero text fill is complete after a jump, and resets at the top', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('#hero-title .c.on')).toHaveCount(0)
  await page.keyboard.press('End')
  await page.waitForTimeout(800)
  await page.keyboard.press('Home')
  await page.waitForTimeout(800)
  await expect(page.locator('#hero-title .c.on')).toHaveCount(0)
  await page.evaluate(() => scrollTo(0, innerHeight * 0.6))
  await page.waitForTimeout(800)
  const total = await page.locator('#hero-title .c').count()
  await expect(page.locator('#hero-title .c.on')).toHaveCount(total)
})

test('reduced motion: static hero, full headline, nothing pinned', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  await page.goto('/')
  await expect(page.locator('.hero__canvas')).toBeHidden()
  expect(await page.locator('#hero-title').evaluate((e) => getComputedStyle(e).color)).toBe('rgb(246, 242, 234)')
  const h = await page.locator('.hero').evaluate((e) => e.getBoundingClientRect().height)
  expect(h).toBeLessThanOrEqual(901)
  await ctx.close()
})

test('only one WebGL context, created only in the world tab', async ({ page }) => {
  await page.goto('/#chain')
  await page.waitForTimeout(800)
  await expect(page.locator('canvas')).toHaveCount(1) // the hero's 2D canvas
  await page.getByRole('tab', { name: 'Across the world' }).click()
  await expect(page.locator('.globe-wrap canvas')).toHaveCount(1, { timeout: 10_000 })
  await page.getByRole('tab', { name: 'At the coast' }).click()
  await expect(page.locator('.globe-wrap canvas')).toHaveCount(0)
})
