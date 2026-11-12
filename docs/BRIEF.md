# Master brief — Skylark Terminal Edition (condensed copy)

Condensed from the master brief Tarun handed over on 12 Nov 2026. The full text is in the conversation that started this
repo; this copy keeps every requirement, number and rule, without the prose.

## Mission
Rebuild skylarkexim's site (skylark-exim-v3) the terminal-industries.com way: one cinematic scroll-scrubbed hero, then
fast, typographic, useful sections. Keep brand, copy, products, markets and the best footage; cut the heavy parts; add a
shipment builder (Terminal's calculator, translated). New repo, new Vercel project, comparison report against the old site.

## Sources
- Source repo `skylark-exim-v3` (read-only); newest state is the local `wt-story` worktree. Old production:
  https://skylark-exim-v3.vercel.app (/, /story#ocean, /story#pond, /quote, /order, /news).
- Company facts and copy come only from `docs/CONTENT.md` (via `src/config/content.ts`). No prices, MOQ, sizes/counts.
- `HIGGSFIELD.md` bans: the phrases "Bay of Bengal" and "purse seine"; no salmon; species shown correctly.

## Page (/)
- S0 header: logo, Story→#chain, Products, Markets, Company profile PDF, Contact, CTA "Request export quote". Bar → pill,
  never overlapping content at resting positions.
- S1 hero: pinned ≤ 280 vh canvas frame sequence (cg-depart-1 → 2 → 3 → cg-port), per-character text fill on
  "From Visakhapatnam to the world.", twin moment at ~55–70 % (blueprint treatment + chips: field names, −18 °C,
  HACCP · EU · FDA, mono line "Every batch has a history."), real preload %, poster + H1 legible ≤ 1 s on repeat visit,
  notch wipe into cream content. Mobile: ≤ 3 MB sequence or a ≤ 2 MB loop.
- S2 markets strip (15, by region). S3 three problems. S4 the chain: tabs AT THE COAST / IN THE PLANT / AT THE PORT /
  ACROSS THE WORLD (Ocean + Pond side by side; plant stills; port + docs; lazy globe, the only WebGL context).
- S5 shipment builder: category → product → form → 1–100 MT → market → state; containers = ceil(qty / 25)
  (REEFER_PAYLOAD_MT, one named constant), cold-chain line, documents checklist, route visual, CTA pre-fills /quote,
  every output "Indicative — confirmed on quote.", pure function + unit tests, no prices/rates/transit times.
- S6 products, S7 why choose us + facts, S8 FAQ (CONTENT.md answers only, else "Ask us"), S9 one footer on every page
  (PDF + quote + order links, both phones, email, office, unit), visible on any jump to the bottom.
- /quote (mailto fallback kept) and /order carried over; /story* → /#chain; /news optional.

## Tech
Vite + React 19 + TS + npm on Vercel. GSAP ScrollTrigger + Lenis on one clock. three only for the globe (DPR ≤ 1.5,
lazy, paused off-screen). Banned: motion, a second scroll library, CSS-in-JS runtime. Copy only shipped assets;
MEDIA.md lists each. No secrets. A11y: landmarks, alt text, focus, AA contrast, prefers-reduced-motion (static hero).

## Gates (§10)
| Gate | Target |
|---|---|
| Initial load to legible poster + H1 | ≤ 3.5 MB |
| Full scroll | ≤ 15 MB |
| Hero sequence | ≤ 8 MB desktop / ≤ 3 MB mobile |
| Scroll perf, 4× CPU throttle | ≥ 55 fps avg, p95 ≤ 33 ms, ≤ 10 long tasks, none > 200 ms |
| Jank feel | no invisible / ghosted / half-revealed content at rest |
| Lighthouse mobile (prod) | Perf ≥ 85, A11y ≥ 95, BP ≥ 95 |
| Console | zero errors, zero 404s |
| Media | every file in MEDIA.md, ≤ 40 MB total |
| Correctness | facts verbatim, calculator tests pass, mailto fallback works without env |

## Guardrails (§12)
No invented facts; banned phrases absent; source repo and old Vercel project untouched; no new generated media; no
Terminal copy/palette/branding; when silent, choose the simpler option and log it in DECISIONS.md.
