import { ScrollTrigger, reduced } from './scroll'

/**
 * S1: one pinned, scroll-scrubbed frame sequence on a single canvas (the Terminal pattern).
 * Frames: public/hero/{d,m}_NNN.webp from scripts/hero-frames.sh. Blobs are fetched in a coarse-to-fine order and kept;
 * at most LRU decoded ImageBitmaps live at once (a 1280×720 bitmap is 3.7 MB of memory). createImageBitmap decodes off
 * the main thread, so no worker is needed.
 */
const FRAMES = 145
const LRU = 28
const PHONE = matchMedia('(max-width: 768px) and (orientation: portrait)').matches
const url = (i: number) => `/hero/${PHONE ? 'm' : 'd'}_${String(i).padStart(3, '0')}.webp`
/** scroll (in viewport heights) over which the frames play; the cream panel wipes in over the pinned hero after it */
const SCRUB_VH = 1.35
/** where the "digital twin" moment sits in the scrub */
const TWIN: [number, number, number, number] = [0.5, 0.58, 0.7, 0.78]

const hero = document.querySelector<HTMLElement>('.hero')!
const canvas = hero.querySelector('canvas')!
const ctx = canvas.getContext('2d', { alpha: false })!
const h1 = hero.querySelector('h1')!
const load = hero.querySelector<HTMLElement>('.hero__load')!

const clamp01 = (t: number) => Math.min(1, Math.max(0, t))
const ramp = (p: number, [a, b, c, d]: number[]) => (p < b ? clamp01((p - a) / (b - a)) : clamp01((d - p) / (d - c)))

/** per-character text fill: state is a pure function of progress, so any jump (hash, End, resize) lands correct */
function splitHeadline() {
  const text = h1.textContent!.trim()
  h1.setAttribute('aria-label', text)
  h1.textContent = ''
  const chars: HTMLSpanElement[] = []
  for (const word of text.split(' ')) {
    const w = document.createElement('span')
    w.className = 'w'
    w.setAttribute('aria-hidden', 'true')
    for (const ch of word) {
      const c = document.createElement('span')
      c.className = 'c'
      c.textContent = ch
      w.append(c)
      chars.push(c)
    }
    h1.append(w, ' ')
  }
  let lit = -1
  return (t: number) => {
    const n = Math.round(clamp01(t) * chars.length)
    if (n === lit) return
    chars.forEach((c, i) => c.classList.toggle('on', i < n))
    lit = n
  }
}

function engine() {
  const blobs: (Blob | undefined)[] = []
  const bitmaps = new Map<number, ImageBitmap>()
  const decoding = new Set<number>()
  let want = 0
  let drawn = -1
  let active = true

  // coarse to fine: frame 0, every 8th, every 4th, every 2nd, the rest
  const order: number[] = []
  const seen = new Set<number>()
  for (const s of [FRAMES, 8, 4, 2, 1]) for (let i = 0; i < FRAMES; i += s) if (!seen.has(i)) (seen.add(i), order.push(i))
  let next = 0
  let loaded = 0
  const pump = async () => {
    while (next < order.length) {
      const i = order[next++]
      try {
        blobs[i] = await (await fetch(url(i))).blob()
      } catch {
        continue
      }
      loaded++
      load.textContent = loaded < FRAMES ? `Loading ${Math.round((loaded / FRAMES) * 100)}%` : ''
      if (Math.abs(i - want) <= LRU / 2) decodeAround()
    }
  }
  for (let k = 0; k < 4; k++) pump()

  function decodeAround() {
    if (!active) return
    for (let d = 0; d <= LRU / 2; d++)
      for (const i of [want + d, want - d]) {
        if (i < 0 || i >= FRAMES || bitmaps.has(i) || decoding.has(i) || !blobs[i]) continue
        decoding.add(i)
        createImageBitmap(blobs[i]!).then((b) => {
          decoding.delete(i)
          if (!active) return b.close()
          bitmaps.set(i, b)
          evict()
          if (Math.abs(i - want) < Math.abs(drawn - want) || drawn < 0) draw()
        }, () => decoding.delete(i))
      }
  }
  function evict() {
    if (bitmaps.size <= LRU) return
    const far = [...bitmaps.keys()].sort((a, b) => Math.abs(b - want) - Math.abs(a - want))
    for (const i of far.slice(0, bitmaps.size - LRU)) (bitmaps.get(i)!.close(), bitmaps.delete(i))
  }
  /** nearest decoded frame to the wanted one */
  function draw() {
    let best = -1
    for (const i of bitmaps.keys()) if (best < 0 || Math.abs(i - want) < Math.abs(best - want)) best = i
    if (best < 0 || best === drawn) return
    const b = bitmaps.get(best)!
    if (canvas.width !== b.width) (canvas.width = b.width), (canvas.height = b.height)
    ctx.drawImage(b, 0, 0)
    if (drawn < 0) hero.classList.add('is-live')
    drawn = best
  }

  return {
    seek(p: number) {
      want = Math.round(clamp01(p) * (FRAMES - 1))
      draw()
      decodeAround()
    },
    /** off screen: free the decoded frames (the blobs stay, ~5 MB) */
    setActive(on: boolean) {
      active = on
      if (on) return decodeAround()
      for (const b of bitmaps.values()) b.close()
      bitmaps.clear()
      drawn = -1
      hero.classList.remove('is-live')
    },
  }
}

if (!reduced) {
  const fill = splitHeadline()
  const film = engine()
  const set = (k: string, v: number) => hero.style.setProperty(k, v.toFixed(3))
  const apply = (p: number) => {
    film.seek(p)
    fill(p / 0.3)
    set('--copy', 1 - clamp01((p - 0.38) / 0.1))
    set('--cue', 1 - clamp01(p / 0.05))
    set('--line', clamp01(p))
    const twin = ramp(p, TWIN)
    set('--twin', twin)
    canvas.style.filter = twin > 0.01 ? `grayscale(${twin}) contrast(${1 + 0.35 * twin}) brightness(${1 - 0.3 * twin})` : ''
  }
  ScrollTrigger.create({
    trigger: hero,
    start: 'top top',
    end: () => `+=${innerHeight * SCRUB_VH}`,
    invalidateOnRefresh: true,
    onUpdate: (st) => apply(st.progress),
    onRefresh: (st) => apply(st.progress),
  })
  apply(0)
  // the hero's frames only live while the hero is on screen
  new IntersectionObserver(([e]) => film.setActive(e.isIntersecting)).observe(hero)
}
