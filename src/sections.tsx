import { CONTACT, MARINE_FISH, SHRIMPS, STATES, TRUST, film } from './config/content'
import { MARKET_COORDS, MARKET_COUNT, MARKETS_BY_REGION, marketLabel } from './config/markets'
import { CATEGORIES, SHRIMP_FORMS, SPECIES_OFFERED, productSrc } from './config/products'

export function Head({ num, title, lead, id }: { num: string; title: string; lead?: string; id: string }) {
  return (
    <header className="sec__head">
      <p className="sec__num mono">{num}</p>
      <h2 id={id}>{title}</h2>
      {lead && <p className="lead">{lead}</p>}
    </header>
  )
}

/** S2: the 15 markets by region (static; also the globe's text alternative). */
export function Markets() {
  return (
    <section className="sec" id="markets" aria-labelledby="markets-t">
      <Head num="01 — Markets" id="markets-t" title={`Trusted in ${MARKET_COUNT} markets.`} lead="From Visakhapatnam to the world’s table." />
      <div className="regions">
        {MARKETS_BY_REGION.map(({ region, markets }) => (
          <div key={region}>
            <h3>{region}</h3>
            <ul>
              {markets.map((i) => (
                <li key={i}>{marketLabel(MARKET_COORDS[i].name)}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}

/** S3: three problems, one line each (CONTENT.md process facts). */
const PROBLEMS = [
  { title: 'Spoilage in transit', line: 'Reefer containers maintain the cold chain until the destination; cold storage is held at −18 °C to −20 °C.' },
  { title: 'Export paperwork', line: 'Documentation staff prepare all necessary documents and handle logistical tracking of shipments. Compliance with export certificates (HACCP, EU, FDA, etc.).' },
  { title: 'No traceability', line: 'Superior freshness, traceability, and product integrity across all markets. Every batch is labelled: product, size, batch, export compliance.' },
]
export function Problems() {
  return (
    <section className="sec" id="problems" aria-labelledby="problems-t">
      <Head num="02 — The problem" id="problems-t" title="Three ways a seafood shipment goes wrong." />
      <div className="cards">
        {PROBLEMS.map((p, i) => (
          <article className="card" key={p.title}>
            <p className="mono sec__num">{String(i + 1).padStart(2, '0')}</p>
            <h3>{p.title}</h3>
            <p>{p.line}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

/** S6: the product grid, unchanged in content. */
export function Products() {
  return (
    <section className="sec" id="products" aria-labelledby="products-t">
      <Head num="05 — Products" id="products-t" title="What we export." lead={`${STATES.join(', ')}. Species offered: ${SPECIES_OFFERED}.`} />
      {(['marine', 'shrimps'] as const).map((cat) => (
        <div className="prod-cat" key={cat}>
          <h3>{CATEGORIES[cat].label}</h3>
          <ul className="prods">
            {CATEGORIES[cat].products.map((p) => (
              <li key={p.name}>
                <picture>
                  <source type="image/avif" srcSet={productSrc(p.image, 'avif')} sizes="(max-width: 600px) 45vw, 200px" />
                  <img src={`/media/${p.image}_480.webp`} srcSet={productSrc(p.image, 'webp')} sizes="(max-width: 600px) 45vw, 200px" width="480" height="480" loading="lazy" decoding="async" alt={p.name} />
                </picture>
                <b>{p.name}</b>
                {p.latin && <i>{p.latin}</i>}
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div className="prod-cat">
        <h3>Shrimp forms</h3>
        <table>
          <thead>
            <tr><th scope="col">Form</th><th scope="col">Options</th></tr>
          </thead>
          <tbody>
            {SHRIMP_FORMS.map((f) => (
              <tr key={f.name}><td>{f.name}</td><td>{f.options}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

/** S7: why choose us + facts. */
export function Trust() {
  return (
    <section className="sec" id="about" aria-labelledby="trust-t">
      <Head num="06 — Why Skylark" id="trust-t" title={TRUST.title + '.'} lead={TRUST.compliance + '.'} />
      <div className="facts">
        {TRUST.facts.map((f) => (
          <div key={f.label}><b>{f.value}</b><span>{f.label}</span></div>
        ))}
      </div>
      <div className="tiles">
        {TRUST.tiles.map((t) => (
          <div key={t.title}><h3>{t.title}</h3><p>{t.line}</p></div>
        ))}
      </div>
    </section>
  )
}

/** S8: answers only from CONTENT.md facts; anything else is "Ask us". */
const FAQ: { q: string; a: string }[] = [
  { q: 'What do you export?', a: `Premium raw fresh, chilled and frozen seafood. Marine fish: ${MARINE_FISH.join(', ')}. Shrimps: ${SHRIMPS.join(', ')}.` },
  { q: 'Which markets do you ship to?', a: `${MARKET_COUNT} markets: ${MARKET_COORDS.map((m) => marketLabel(m.name)).join(', ')}.` },
  { q: 'How is the cold chain maintained?', a: `${film.coldchain[1].body} Cold storage is held at −18 °C to −20 °C; our warehouse has a total storage capacity of 700 pallets. ${film.port[0].body}` },
  { q: 'What forms are shrimp available in?', a: SHRIMP_FORMS.map((f) => `${f.name} (${f.options})`).join(', ') + '.' },
  { q: 'Which certifications do you comply with?', a: TRUST.compliance + '.' },
  { q: 'How do I get a quote?', a: `Use the shipment builder above or the quote form, or write to ${CONTACT.email}. Phone: ${CONTACT.phones.map((p) => p.label).join(' or ')}.` },
  { q: 'What are your prices and minimum order quantities?', a: `Ask us — ${CONTACT.email}.` },
]
export function Faq() {
  return (
    <section className="sec faq" id="faq" aria-labelledby="faq-t">
      <Head num="07 — FAQ" id="faq-t" title="Questions buyers ask." />
      {FAQ.map((f) => (
        <details key={f.q}>
          <summary>{f.q}</summary>
          <p>{f.a}</p>
        </details>
      ))}
    </section>
  )
}
