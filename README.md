# Skylark Exim — Terminal edition

A rebuild of the Skylark Exim site along the lines of terminal-industries.com: one scroll-scrubbed hero, then fast,
typographic sections and a shipment builder. Assets and copy come from `skylark-exim-v3` (read-only source). See
`docs/BRIEF.md`, `DECISIONS.md`, `MEDIA.md`, `COMPARISON.md`.

## Run
```sh
npm ci
npm run dev          # http://localhost:5174
npm run typecheck && npm run build
npm run preview      # http://localhost:4174
npm run test:unit    # shipment calculator (node --test)
BASE_URL=http://localhost:4174 npx playwright test              # site gates + scroll perf
BASE_URL=https://… PERF_PATHS=/ npx playwright test tests/scroll-perf.spec.ts
node scripts/shots.mjs <base> <outDir> "/,/quote"               # screenshots + transfer metrics
```
No secrets are needed. Optional, as in the source: `RESEND_API_KEY`, `RFQ_FROM`, `RFQ_TO` for `api/rfq.ts`. Without
them, the quote form opens a pre-filled `mailto:info@skylarkexim.com`.

## Architecture
- `index.html`: the hero is static markup (poster `<img>` + H1), so it paints before any script runs.
- `src/hero.ts`: canvas frame sequence (`public/hero/{d,m}_NNN.webp`, 145 frames, `scripts/hero-frames.sh`),
  per-character fill and twin moment as pure functions of scroll progress.
- `src/scroll.ts`: Lenis on the GSAP ticker, with ScrollTrigger: one clock, one animation stack.
- `src/home.tsx`: React mounts the header (`src/ui.tsx`) and the sections (`sections.tsx`, `Chain.tsx`,
  `Builder.tsx`).
- `src/globe.ts`: plain three.js, lazy chunk; the page's only WebGL context, only in the ACROSS THE WORLD tab.
- `src/config/`: `content.ts`, `markets.ts`, `products.ts`, `rfq.ts` from the source repo (CONTENT.md facts);
  `shipment.ts` is the builder's pure function (`REEFER_PAYLOAD_MT = 25`, indicative).
- `/quote` = `quote.html` + `src/quote.tsx` + `src/RfqForm.tsx` (hash pre-fill from the builder); `/order` and `/404`
  are static files in `public/`. `/story*` redirects to `/#chain` (`vercel.json`).

## What was cut, and why
- Two films (Ocean 10 chapters, about 1,840 vh; Pond 9 chapters, about 1,635 vh): one 280 vh hero plus one tabbed story
  in which both origins share a viewport. The path-switch bug class is gone with the mechanism.
- The `<video>` decoder pool with seek queues (`src/film/scrub.ts`, 605 lines), `warmcache.ts`, `engine/ticker.ts`:
  replaced by one canvas and decoded stills.
- Four animation systems (Lenis + GSAP + Motion + custom rAF ticker): Lenis + GSAP only. No `motion`, no R3F/Drei.
- 2,393-file media tree (5 sizes × 3 codecs): 410 shipped files, 16.4 MB (`MEDIA.md`).

## Changing a shipped asset
`/media`, `/hero` and `/textures` are cached immutably and their file names have no hash. A changed file needs a new
name. Re-run `node scripts/media-md.mjs` after any asset change.
