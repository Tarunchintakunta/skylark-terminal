import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger)

export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * One clock for the page: Lenis is driven from the GSAP ticker, and ScrollTrigger reads Lenis's scroll.
 * No Lenis under reduced motion (native scroll, nothing pinned).
 */
export const lenis = reduced ? null : new Lenis({ anchors: true, lerp: 0.12 })
if (lenis) {
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((t) => lenis.raf(t * 1000))
  gsap.ticker.lagSmoothing(0)
}

export { gsap, ScrollTrigger }
