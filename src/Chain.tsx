import { useEffect, useRef, useState } from 'react'
import { DOC_CARDS, film } from './config/content'
import { MARKET_COUNT } from './config/markets'
import { Head } from './sections'

/** a poster still at 960 / 1280, AVIF with WebP fallback, lazy */
function Still({ id, alt }: { id: string; alt: string }) {
  const set = (ext: string) => `/media/${id}_960.${ext} 960w, /media/${id}_1280.${ext} 1280w`
  return (
    <picture>
      <source type="image/avif" srcSet={set('avif')} sizes="(max-width: 768px) 100vw, 50vw" />
      <img src={`/media/${id}_960.webp`} srcSet={set('webp')} sizes="(max-width: 768px) 100vw, 50vw" width="960" height="540" loading="lazy" decoding="async" alt={alt} />
    </picture>
  )
}

const TABS = ['At the coast', 'In the plant', 'At the port', 'Across the world'] as const
type Tab = (typeof TABS)[number]

/** The globe: three.js chunk imported when the section nears the viewport; the WebGL context exists only while this tab is open (unmount disposes it), and renders only while on screen. */
function GlobePanel() {
  const host = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let g: { setActive(on: boolean): void; dispose(): void } | undefined
    let dead = false
    import('./globe').then(({ mountGlobe }) => {
      if (dead || !host.current) return
      g = mountGlobe(host.current)
      g.setActive(true)
    })
    return () => {
      dead = true
      g?.dispose()
    }
  }, [])
  return (
    <div className="split">
      <div>
        <div ref={host} className="globe-wrap" tabIndex={0} role="img" aria-label={`Globe of the ${MARKET_COUNT} export markets with routes from Visakhapatnam. Drag or use the arrow keys to turn it. The markets are listed in section 01.`} />
        <p className="globe-hint mono">Drag or use the arrow keys</p>
      </div>
      <div>
        <h3 style={{ fontSize: 'var(--fs-h3)', marginBottom: 12 }}>{film.world[0].title}</h3>
        <p className="panel__intro">{film.world[0].body}</p>
        <p className="note mono">{film.sea[0].title}</p>
      </div>
    </div>
  )
}

/** S4: one story in four tabs. A tab switch swaps one panel in place: no scroll-jacking, scroll position never moves. */
export function Chain() {
  const [tab, setTab] = useState<Tab>(TABS[0])
  const [near, setNear] = useState(false)
  const sec = useRef<HTMLElement>(null)
  const btns = useRef<(HTMLButtonElement | null)[]>([])

  // warm the three.js chunk as the section nears (600 px), so the world tab opens fast
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setNear(true), io.disconnect()), { rootMargin: '600px' })
    io.observe(sec.current!)
    return () => io.disconnect()
  }, [])
  useEffect(() => {
    if (near) import('./globe')
  }, [near])

  const onKey = (e: React.KeyboardEvent, i: number) => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!d) return
    const n = (i + d + TABS.length) % TABS.length
    setTab(TABS[n])
    btns.current[n]?.focus()
  }

  const [process, , made] = film.process
  const [lab, freeze, , store] = film.coldchain
  return (
    <section className="sec" id="chain" ref={sec} aria-labelledby="chain-t">
      <Head num="03 — The chain" id="chain-t" title="One unbroken cold chain." lead="From water to world, every batch carries its data with it." />
      <div className="tabs" role="tablist" aria-label="The chain">
        {TABS.map((t, i) => (
          <button key={t} ref={(el) => void (btns.current[i] = el)} className="tab" role="tab" id={`tab-${i}`} aria-controls={`panel-${i}`} aria-selected={tab === t} tabIndex={tab === t ? 0 : -1} onClick={() => setTab(t)} onKeyDown={(e) => onKey(e, i)}>
            {t}
          </button>
        ))}
      </div>
      {TABS.map((t, i) => (
        <div key={t} className="panel" role="tabpanel" id={`panel-${i}`} aria-labelledby={`tab-${i}`} hidden={tab !== t}>
          {tab === t && i === 0 && (
            <>
              <p className="panel__intro">{film.o1[0].body}</p>
              <div className="duo">
                <figure className="fig">
                  <Still id="cg-catch" alt="At sunrise a trawler's stern gantry winches a full net of silver fish up onto the stern ramp, two crew in orange oilskins standing clear." />
                  <p className="mono sec__num">Wild catch</p>
                  <h3>{film.o2[0].title}</h3>
                  <p>{film.o2[0].body}</p>
                </figure>
                <figure className="fig">
                  <Still id="cg-ponds" alt="Aerial view at sunrise over coastal shrimp ponds lined with coconut palms, paddle-wheel aerators throwing white water, a refrigerated truck on a bund road." />
                  <p className="mono sec__num">Farmed shrimp</p>
                  <h3>{film.p1[0].title}</h3>
                  <p>{film.p1[0].body}</p>
                </figure>
              </div>
            </>
          )}
          {tab === t && i === 1 && (
            <>
              <p className="panel__intro">{film['intake.any'][0].body}</p>
              <div className="quad">
                {[
                  { id: 'hf-wash', c: process, alt: 'A bright processing hall: shrimp ride a conveyor while workers in caps, masks and gloves grade them at stainless tables.' },
                  { id: 'hf-peel', c: made, alt: 'Workers peel and devein shrimp by hand at a stainless table.' },
                  { id: 'hf-lab', c: lab, alt: 'In the quality lab, a technician in a white coat inspects a raw shrimp with tweezers at the window bench.' },
                  { id: 'hf-iqf', c: freeze, alt: 'Individually spaced shrimp ride a stainless mesh belt into the IQF freezing tunnel through light cold vapour.' },
                ].map((s) => (
                  <figure className="fig" key={s.id}>
                    <Still id={s.id} alt={s.alt} />
                    <h3>{s.c.title}</h3>
                    <p>{s.c.body}</p>
                  </figure>
                ))}
              </div>
              <p className="note mono">{store.title} · {store.body}</p>
            </>
          )}
          {tab === t && i === 2 && (
            <div className="split">
              <figure className="fig">
                <Still id="cg-port" alt="On the quay in the morning haze, a plain white refrigerated container waits on a truck under the ship-to-shore cranes beside a moored container ship." />
                <h3>{film.port[0].title}</h3>
                <p>{film.port[0].body}</p>
              </figure>
              <div>
                <p className="panel__intro">{film.docs[0].body}</p>
                <ul className="docs">
                  {DOC_CARDS.map((d) => (
                    <li key={d} className="mono">{d}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {tab === t && i === 3 && <GlobePanel />}
        </div>
      ))}
    </section>
  )
}
