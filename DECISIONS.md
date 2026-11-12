# DECISIONS

Every place this build departs from, interprets, or fills a gap in the brief (docs/BRIEF.md), and why.

## Brief vs. source repo facts
1. **Source repo owner.** The brief names `Tarunchintakunta/skylark-exim-v3`; the `wt-story` worktree's remote is
   `Miyo-global/skylark-exim-v3`. Neither was pushed to, branched or modified. Assets and copy come from the local
   `wt-story` worktree (HEAD `bc4defb6`, 12 Nov 2026), which is ahead of production.
2. **Phone numbers** are written as in `content.ts` (`+91-9000 604 070`, `+91-9885 827 318`), not the brief's grouping.
   Same digits.
3. **"40-foot" container.** The source alt text for `cg-port` says "40-foot"; CONTENT.md "Never write" lists "40 ft".
   The alt here drops it.
4. **The cold-chain line in the builder.** The brief asks for "Held at −18 °C to −20 °C from Anandapuram to {market}"
   for every shipment. In CONTENT.md, −18 °C to −20 °C is the *cold store* temperature, which only describes frozen
   product. Saying it for raw fresh or chilled loads would be a false claim. Frozen gets the brief's line; raw fresh and
   chilled get "Shipped in reefer containers to maintain the cold chain from Anandapuram to {market}." (CONTENT.md port
   line). Covered by `tests/unit/shipment.test.ts`.
5. **Old-site numbers.** The "2,393 media files" and perf-report figures in the brief come from the `wt-story`
   worktree. Production (`skylark-exim-v3.vercel.app`) is an older build; COMPARISON.md labels each number with
   where it was measured.

## Simpler or lighter choices (brief silent or allows it)
6. **Pin = CSS `position: sticky`, not a ScrollTrigger pin.** The hero section is 280 vh with a sticky 100 vh stage.
   ScrollTrigger (driven by Lenis on the GSAP ticker) only reads progress. A sticky pin has no pin-spacer reflow on
   refresh and cannot jump on hash loads.
7. **Notch wipe in pure CSS.** The cream content panel has `margin-top: -70vh` and a `clip-path` notch on its top
   edge, so it rises over the pinned hero's last frames by native scroll. No JS, so it can't land half-finished.
8. **Twin moment in CSS over the canvas.** CSS `filter` (grayscale/contrast/brightness) on the canvas, plus a
   blueprint grid layer and the three chips, with opacity driven by progress (50–78 % of the scrub). No per-frame edge
   detection: on a 4× throttled CPU that would break the frame budget. No new renders. A future option is an
   ffmpeg `edgedetect` pass over ~30 existing frames, which is post-processing, not generation.
9. **No Web Worker for decoding.** `createImageBitmap(blob)` already decodes off the main thread, so a worker would add
   code without adding speed. LRU of 28 decoded frames. Fetching is coarse to fine (0, every 8th, every 4th, every
   2nd, the rest), 4 parallel, and starts after the window `load` event.
10. **No scroll-position interpolation between frames.** Lenis already smooths scroll position. The frame drawn is the
    nearest decoded one. At 145 frames over 1.35 viewports that is about 9 px of scroll per frame.
11. **Hero frame budget.** 145 frames (every 3rd master frame of each depart shot, every 5th of `cg-port`; chained
    shots drop their shared first frame). That's under the ≤ 220 cap and leaves room in the 8 MB budget: desktop
    5.37 MB, phone 2.65 MB. Because the phone set meets ≤ 3 MB, phones get the canvas sequence, not the MP4 fallback.
12. **Globe rewritten in plain three.js (~150 lines), not the source `Globe.tsx`.** The source globe (606 lines) is
    tied into the film engine (custom ticker, scroll store, film chapter state), and porting it would bring that
    engine back. This version keeps the source data and geometry (`markets.ts`, `geo.ts` latLon/routePoints, settled
    view lon 70 / lat 24) and adds drag plus arrow keys. React Three Fiber and Drei are not dependencies. The WebGL
    context exists only while the ACROSS THE WORLD tab is open; it is disposed on tab switch and paused off screen;
    DPR ≤ 1.5. The three.js chunk is prefetched when the section is within 600 px.
13. **Route visual in the builder** is an SVG flat projection (dots and arc), with no coastline data, so there is no
    second WebGL context and no map asset.
14. **Products: no fade.** Static, lazy, with width and height set, so there is no hidden state to get stuck.
15. **No reveal animations anywhere below the hero.** This fixes the ghost-text, invisible-footer and half-revealed
    bug class by design: nothing is opacity-gated except the tab panel's 0.45 s CSS fade-in, which starts from mount.
16. **Header pill clearance.** A fixed pill sits over content while the page scrolls; that can't be avoided.
    The brief's rule is met where it matters: the pill is solid (never tangles with text), and every anchor
    target or section top rests ≥ 8 px below it (`scroll-padding-top` and section padding are `--clear` = 100 px).
    `tests/site.spec.ts` checks 5 anchor depths.
17. **/news omitted** from v1: there is no link and no route.
18. **/order** is the source's standalone page, unchanged in function (formsubmit + sheet webhook). Its nav and
    footer were swapped for the shared ones; the footer markup is hand-copied, and a test compares it.
19. **Footer has no year**, so the static and React copies can't drift.
20. **Fonts `font-display: swap`** (the source used `block`): with `block`, the H1 could stay invisible for up to 3 s on
    a slow font.
21. **Media caching.** `/media`, `/hero` and `/textures` are cached immutably as the brief asks. The file names have no
    content hash, so **any change to a shipped asset needs a new file name** (README).
22. **Analytics** (`@vercel/analytics`, speed-insights) not carried over (not in the allowed dependency list).
23. **Commit history.** Phases 1–5 were written in one pass and then committed as separate phase commits (scaffold,
    hero, static sections, chain, builder), each with its own `home.tsx` stage.
24. **docs/BRIEF.md** is a condensed copy of the brief: every requirement and number, without the prose.
25. **FAQ** adds "Which certifications do you comply with?" (CONTENT.md compliance line) and "What are your prices and
    minimum order quantities?" (answer: "Ask us — info@skylarkexim.com"), so no price or MOQ is ever implied.

## TODO-COPY (needs Tarun's approval; editorial headlines, no factual claim)
- S3 heading "Three ways a seafood shipment goes wrong."
- S4 heading "One unbroken cold chain." / lead "From water to world, every batch carries its data with it." (brief §4)
- S5 heading "Plan a shipment." and its lead line
- S7 FAQ heading "Questions buyers ask."
- Hero chip labels "Batch", "Cold store", "Compliance" (field names, no values)
