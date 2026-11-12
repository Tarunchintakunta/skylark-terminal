# COMPARISON — old site vs Terminal edition

- **Old:** https://skylark-exim-v3.vercel.app (production, older than the `wt-story` worktree)
- **New:** https://skylark-terminal-three.vercel.app (repo `Tarunchintakunta/skylark-terminal`, Vercel team `miyoglobal1`)
- Measured 12 Nov 2026 from one Mac (Playwright 1.64 Chromium, Lighthouse from the source repo's `@lhci/cli`).
  Raw data: `comparison/before/metrics.json`, `comparison/after/metrics.json`, `comparison/perf-old.json`,
  `comparison/perf-new.json`, `comparison/lighthouse/*.json`, `comparison/legible*.jsonl`.

## Numbers

| Measure | Old | New | Gate | Pass |
|---|---|---|---|---|
| Scroll perf `/`, slow wheel, 4× CPU (`tests/scroll-perf.spec.ts`, same spec both sites) | 44.3 fps · p95 50 ms · 33 long tasks · max 224 ms | **59.3 fps · p95 16.8 ms · 0 long tasks** | ≥ 55 · ≤ 33 ms · ≤ 10 · none > 200 ms | ✅ |
| Scroll perf `/`, fast flings + End, 4× CPU | 56.2 fps · p95 16.8 ms · 1 long task · max 156 ms | **60 fps · p95 16.7 ms · 0 long tasks** | same | ✅ |
| Scroll perf `/story#ocean`, 4× CPU (source repo's own `perf-report.json`, wt-story) | 18.1 fps · p95 150 ms · 466 long tasks · max 4,414 ms | no /story (redirects to `/#chain`) | — | — |
| Scroll perf `/story#pond`, 4× CPU (same file) | 27.7 fps · p95 117 ms · 326 long tasks · max 399 ms | — | — | — |
| Lighthouse mobile `/` (Perf / A11y / BP / SEO) | 87 / 100 / 100 / 100 | **92 / 100 / 100 / 92** (a rerun: 89 / 100 / 100 / 92) | ≥ 85 / ≥ 95 / ≥ 95 | ✅ |
| Lighthouse mobile `/quote` | 95 / 100 / 100 / 92 | 94 / 100 / 100 / 100 | same | ✅ |
| Lighthouse mobile `/order` | — | 89 / 98 / 100 / 100 | same | ✅ |
| Bytes to a legible poster + H1, `/` desktop | 0.67 MB by 2.5 s (h1 legible at 2.6 s) | **0.05 MB** at legible; LH total page weight 0.4–2.6 MB | ≤ 3.5 MB | ✅ |
| Full scroll, `/` desktop | 2.81 MB (home) · 6.07 MB (`/story#ocean`) · 4.67 MB (`/story#pond`) | **6.09 MB** (whole page incl. 5.37 MB hero) | ≤ 15 MB | ✅ |
| Full scroll, `/` mobile | 2.03 MB home · 10.59 MB `/story#pond` | 1.3 MB measured; ≤ 2.65 MB hero + stills by construction | ≤ 15 MB | ✅ |
| Hero sequence | — (video pool, 5 sizes × 3 codecs) | **5.37 MB desktop (145 × 1280 px WebP) · 2.65 MB phone (145 × 540 px)** | ≤ 8 / ≤ 3 MB | ✅ |
| Hero time-to-legible H1, local preview (no network noise), repeat visit | — | **35–62 ms** (first visit 46–125 ms), poster decoded | ≤ 1 s | ✅ |
| Hero time-to-legible H1, production from this Mac | home 2.6 s desktop first visit; `/story#ocean` 3.3–5.9 s; mobile `/story#ocean` 19.9 s once | 0.39 s desktop, 0.57 s mobile (final run); repeat visit 0.17–2.1 s | ≤ 1 s repeat | ⚠️ see note |
| Shipped media | 2,350 files in `public/media` (2,380 in `public/`), 1.2 GB (wt-story) | **410 files, 16.4 MB** (`MEDIA.md`) | ≤ 40 MB | ✅ |
| Console errors / 404s (`/`, `/quote`, `/order`, 404 page, all chain tabs) | not measured | **0 / 0** | 0 | ✅ |
| Calculator unit tests | — | **5 / 5** | pass | ✅ |
| Site specs on production (`tests/site.spec.ts`) | — | **7 / 7** | — | ✅ |

**Network note.** During the final hour, this machine's link to Vercel (served from `bom1`) was erratic: the same
URL took 0.17 s on one load and 10 s on the next, and a few loads timed out at 30 s. Lighthouse needed one rerun
after a `CHROME_INTERSTITIAL_ERROR`. Production timing numbers carry that noise. The local-preview control shows the
page itself puts a legible H1 and the poster up in under 130 ms. The first ~500 ms of any production visit here is
DNS + TLS + TTFB.

**Old `/story` with the same spec.** `tests/scroll-perf.spec.ts` could not drive `/story#ocean` or `/story#pond` on
production: the page did not scroll from wheel input in a fresh context (25 frames recorded). The story rows above
therefore quote the source repo's own `perf-report.json` as it stands in wt-story. Those figures are worse than the
ones in the brief (32.7 / 31.4 fps), which came from an earlier run.

## Screenshots
Same viewports (desktop 1440×900, mobile 390×844 @2x), same script (`scripts/shots.mjs`): hero, mid-page,
builder (old: 75 % down), footer.

| | Before | After |
|---|---|---|
| Hero | `comparison/before/home-desktop-hero.jpg`, `story-ocean-*-hero.jpg`, `story-pond-*-hero.jpg` | `comparison/after/home-desktop-hero.jpg`, `home-mobile-hero.jpg` |
| Mid-page | `comparison/before/*-mid.jpg` | `comparison/after/home-*-mid.jpg` |
| Calculator / builder | `comparison/before/*-builder.jpg` (old site has none) | `comparison/after/home-*-builder.jpg` |
| Footer | `comparison/before/*-footer.jpg` | `comparison/after/home-*-footer.jpg`, `quote-*-footer.jpg` |

## What was cut
- **Two stories.** Ocean (10 chapters, about 1,840 vh) and Pond (9 chapters, about 1,635 vh) are now one 280 vh
  hero plus one four-tab chain section. Both origins sit side by side in one tab. Path switching is gone, and with it
  the bug class (#311, #313, #314).
- **The `<video>` decoder pool** (`src/film/scrub.ts`, 605 lines: seek queues, the 250 ms hold heuristic, fastSeek
  fallbacks), `warmcache.ts`, `engine/ticker.ts`. In their place: one `<canvas>` and decoded WebP stills.
- **Four animation systems** (Lenis + GSAP + Motion + a custom rAF ticker) are now Lenis + GSAP on one clock. `motion`,
  React Three Fiber and Drei are not dependencies.
- **The 2,350-file media tree** (5 sizes × 3 codecs per clip) is now 410 files, 16.4 MB.
- **The home-page globe** that sat beside the hero and 12 photos now lives only in the ACROSS THE WORLD tab. Its
  context is created there and disposed when you leave the tab.
- `/news` (omitted in v1), the analytics scripts, the loader screen.

## What was kept
- All copy from `content.ts` / CONTENT.md: tagline, process and cold-chain captions, TRUST tiles and facts, contact
  lines.
- Products (8 marine fish, 5 shrimps, Latin names, 6 shrimp forms, 3 states) and their 480/640/960 AVIF/WebP stills.
- The 15 markets and their regions (`markets.ts`), now a static strip and the globe's text alternative.
- The globe: same data, geometry and settled view, rewritten without R3F (DECISIONS #12).
- `/quote`: same zod schema and `api/rfq.ts`. Resend sends when `RESEND_API_KEY` + `RFQ_FROM` are set; otherwise the
  form falls back to a pre-filled `mailto:info@skylarkexim.com`, verified on production (`{"ok":false,"fallback":"mailto"}`).
  It now also takes the builder's pre-fill.
- `/order`: same standalone page and submit flow (formsubmit + sheet webhook). Only the nav and footer changed.
- Palette (deep teal / sand / rust), Instrument Serif + Inter Tight, the logo, the company-profile PDF.

## Fixes to the audit's live bugs
| Old bug | Now |
|---|---|
| Pond hero blank ~5 s, garbled split heading | No second path. The hero poster and H1 are static HTML, painted before JS |
| Ocean heading clipped mid-reveal ~3 s | No reveal: the H1 is fully set on first paint; the fill only changes colour |
| Footer invisible after a fast jump to the bottom | No reveal-gated content anywhere; tested on 4 routes |
| Ghost text under the sticky header | No scroll reveals; solid pill; anchor clearance tested at 5 depths |
| Home footer missing PDF / quote / order links | One footer on every page with all three; a test compares the text across pages |
| "click Begin Journey" (no such button) | Copy removed |
| Home hero slow paint | Poster preloaded with `fetchpriority=high`; frames fetch after `load` |

## Deviations, TODO-COPY, relaxed gates
- **Deviations:** all listed in `DECISIONS.md`. Most relevant: the builder's −18 °C line is shown for frozen only
  (#4), the pin uses CSS sticky (#6), the notch wipe and twin moment are CSS (#7, #8), and the globe was rewritten (#12).
- **TODO-COPY** (editorial headlines, need Tarun's approval): see the list at the end of `DECISIONS.md`.
- **Relaxed gates:** none. One gate is not fully proven on production: "H1 legible ≤ 1 s on a cached repeat visit"
  passes on the local preview (35–62 ms) and in most production runs (0.17–0.65 s). Two production repeat visits from
  this Mac took 1.1 s and 2.1 s, plus outliers of 3.7 s and 10 s, during the network instability above. Re-measure
  from a stable connection.

## Known limitations
1. **`/order` carries source content the brief's guardrails would not allow on new pages.** Its grade field offers
   count grades (U/10 … 91/110) as suggestions, and its copy says the desk "confirms price and ship date"; it shows no
   prices. It is unchanged because the brief says to reuse `/order` as-is. Needs Tarun's call: drop the grade
   suggestions or keep them.
2. Media files are cached `immutable` without content hashes: any changed asset needs a new file name (README).
3. The twin moment is a CSS treatment (desaturated frame + blueprint grid + chips), not a true wireframe render.
4. The builder's route map is schematic (dots and an arc, no coastlines).
5. `REEFER_PAYLOAD_MT = 25` is an indicative planning figure. Operations must confirm it before production use.
6. `skylark-terminal.vercel.app` belongs to an unrelated Vercel project, so this one is on
   `skylark-terminal-three.vercel.app`. Git is not connected in Vercel; deploys are via `vercel --prod --scope miyoglobal1`.
7. Phone landscape and tablets get the desktop frame set (the phone set is chosen by
   `(max-width: 768px) and (orientation: portrait)` at load).
