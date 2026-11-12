import { useMemo, useState } from 'react'
import { MARINE_FISH, SHRIMPS, STATES } from './config/content'
import { MARKET_COORDS, ORIGIN, marketLabel } from './config/markets'
import { SHRIMP_FORMS } from './config/products'
import { QTY_MAX, QTY_MIN, REEFER_PAYLOAD_MT, clampQty, planShipment, type Category, type ShipmentInput } from './config/shipment'
import { Head } from './sections'

/** flat map: x = lon, y = −lat, cropped to Algeria…Japan */
const VB = { x: -15, y: -66, w: 160, h: 80 }
const pt = (lat: number, lon: number) => [lon, -lat] as const

function Route({ market }: { market: string }) {
  const m = MARKET_COORDS.find((c) => marketLabel(c.name) === market)!
  const [ox, oy] = pt(ORIGIN.lat, ORIGIN.lon)
  const [mx, my] = pt(m.lat, m.lon)
  const lift = Math.hypot(mx - ox, my - oy) * 0.35
  const d = `M${ox} ${oy} Q ${(ox + mx) / 2} ${Math.min(oy, my) - lift} ${mx} ${my}`
  return (
    <svg className="route" viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`} role="img" aria-label={`Route from Visakhapatnam to ${market}`}>
      <g className="grid">
        {Array.from({ length: 9 }, (_, i) => <line key={'v' + i} x1={VB.x + i * 20} x2={VB.x + i * 20} y1={VB.y} y2={VB.y + VB.h} />)}
        {Array.from({ length: 5 }, (_, i) => <line key={'h' + i} y1={VB.y + i * 20} y2={VB.y + i * 20} x1={VB.x} x2={VB.x + VB.w} />)}
      </g>
      {MARKET_COORDS.map((c) => {
        const [x, y] = pt(c.lat, c.lon)
        return <circle key={c.name} className={`dot${c === m ? ' on' : ''}`} cx={x} cy={y} r={c === m ? 1.6 : 0.9} />
      })}
      {/* key: a new path per market, so the draw animation replays */}
      <path key={market} className="arc" pathLength={1} d={d} />
      <circle className="origin" cx={ox} cy={oy} r={1.6} />
      <text x={ox + 2.5} y={oy + 4}>Visakhapatnam</text>
      <text x={mx > 110 ? mx - 2.5 : mx + 2.5} y={my - 2.5} textAnchor={mx > 110 ? 'end' : 'start'}>{market}</text>
    </svg>
  )
}

/** S5: the shipment builder (Terminal's calculator, translated). Indicative only; the arithmetic lives in config/shipment.ts. */
export function Builder() {
  const [s, setS] = useState<ShipmentInput>({ category: 'shrimps', product: SHRIMPS[0], form: SHRIMP_FORMS[0].name, quantityMt: 20, market: marketLabel(MARKET_COORDS[10].name), state: 'Frozen' })
  const plan = useMemo(() => planShipment(s), [s])
  const up = (p: Partial<ShipmentInput>) => setS((o) => ({ ...o, ...p }))
  const products = s.category === 'shrimps' ? SHRIMPS : MARINE_FISH

  return (
    <section className="sec" id="builder" aria-labelledby="builder-t">
      <Head num="04 — Shipment builder" id="builder-t" title="Plan a shipment." lead="Pick a product, a quantity and a market. See the containers, the cold chain and the paperwork it takes, then send it to us as a quote request." />
      <div className="builder">
        <form onSubmit={(e) => e.preventDefault()} aria-label="Shipment">
          <label className="fld">
            <span>Category</span>
            <select value={s.category} onChange={(e) => { const c = e.target.value as Category; up({ category: c, product: (c === 'shrimps' ? SHRIMPS : MARINE_FISH)[0] }) }}>
              <option value="shrimps">Shrimps</option>
              <option value="marine">Marine fish</option>
            </select>
          </label>
          <label className="fld">
            <span>Product</span>
            <select value={s.product} onChange={(e) => up({ product: e.target.value })}>
              {products.map((p) => <option key={p}>{p}</option>)}
            </select>
          </label>
          {s.category === 'shrimps' && (
            <label className="fld">
              <span>Form</span>
              <select value={s.form} onChange={(e) => up({ form: e.target.value })}>
                {SHRIMP_FORMS.map((f) => <option key={f.name}>{f.name}</option>)}
              </select>
            </label>
          )}
          <div className="fld">
            <span id="qty-l">Quantity (MT)</span>
            <div className="qty">
              <input type="range" min={QTY_MIN} max={QTY_MAX} step={1} value={plan.quantityMt} aria-labelledby="qty-l" onChange={(e) => up({ quantityMt: +e.target.value })} />
              <input type="number" min={QTY_MIN} max={QTY_MAX} step={1} value={s.quantityMt} aria-labelledby="qty-l" onChange={(e) => up({ quantityMt: +e.target.value })} onBlur={() => up({ quantityMt: clampQty(s.quantityMt) })} />
            </div>
          </div>
          <label className="fld">
            <span>Destination market</span>
            <select value={s.market} onChange={(e) => up({ market: e.target.value })}>
              {MARKET_COORDS.map((m) => <option key={m.name}>{marketLabel(m.name)}</option>)}
            </select>
          </label>
          <fieldset className="seg fld">
            <legend>State</legend>
            {STATES.map((st) => (
              <label key={st}>
                <input type="radio" name="state" value={st} checked={s.state === st} onChange={() => up({ state: st as ShipmentInput['state'] })} />
                <span>{st}</span>
              </label>
            ))}
          </fieldset>
        </form>

        <div className="out" aria-live="polite">
          <p className="out__tag mono">Indicative — confirmed on quote.</p>
          <div className="out__big">
            <b>{plan.containers}</b>
            <span>reefer container{plan.containers > 1 ? 's' : ''} for {plan.quantityMt} MT of {s.product}<br /><small className="mono">Indicative — at {REEFER_PAYLOAD_MT} MT a container</small></span>
          </div>
          <Route market={s.market} />
          <p className="out__line">{plan.coldLine} <small className="mono">Indicative — confirmed on quote.</small></p>
          <div>
            <p className="mono" style={{ marginBottom: 10 }}>Documents for this shipment · Indicative — confirmed on quote.</p>
            <ul>
              {plan.documents.map((d) => <li key={d}>{d}</li>)}
            </ul>
          </div>
          <a className="btn btn--solid" href={plan.quoteHref}>Request export quote</a>
        </div>
      </div>
    </section>
  )
}
