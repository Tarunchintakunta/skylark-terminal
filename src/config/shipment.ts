// Shipment builder arithmetic (S5). One pure function; everything it returns is labelled "Indicative — confirmed on quote."
// No prices, freight rates or transit times: none are in docs/CONTENT.md, so none are invented here.
import { DOC_CARDS, LABEL_FIELDS } from './content.ts'

// indicative planning figure — verify with operations before production use
export const REEFER_PAYLOAD_MT = 25

export const QTY_MIN = 1
export const QTY_MAX = 100

export type Category = 'marine' | 'shrimps'

export interface ShipmentInput {
  category: Category
  product: string
  /** shrimp form; ignored for marine fish */
  form?: string
  quantityMt: number
  market: string
  state: 'Raw fresh' | 'Chilled' | 'Frozen'
}

export interface ShipmentPlan {
  quantityMt: number
  containers: number
  coldLine: string
  documents: string[]
  /** /quote hash that pre-fills the request form */
  quoteHref: string
}

export const clampQty = (q: number) => (Number.isFinite(q) ? Math.min(QTY_MAX, Math.max(QTY_MIN, Math.round(q))) : QTY_MIN)

export function planShipment(i: ShipmentInput): ShipmentPlan {
  const quantityMt = clampQty(i.quantityMt)
  // −18 °C to −20 °C is the cold store (CONTENT.md); it only describes frozen product. Fresh and chilled loads get the
  // reefer line, which holds for any state.
  const coldLine =
    i.state === 'Frozen'
      ? `Held at −18 °C to −20 °C from Anandapuram to ${i.market}.`
      : `Shipped in reefer containers to maintain the cold chain from Anandapuram to ${i.market}.`
  const q = new URLSearchParams({ category: i.category, species: i.product, state: i.state, quantity: `${quantityMt} MT`, destination: i.market })
  if (i.category === 'shrimps' && i.form) q.set('form', i.form)
  return {
    quantityMt,
    containers: Math.ceil(quantityMt / REEFER_PAYLOAD_MT),
    coldLine,
    documents: [...DOC_CARDS, `Carton labels: ${LABEL_FIELDS.join(' / ').toLowerCase()}`],
    quoteHref: `/quote#${q.toString()}`,
  }
}
