import assert from 'node:assert/strict'
import { test } from 'node:test'
import { REEFER_PAYLOAD_MT, clampQty, planShipment, type ShipmentInput } from '../../src/config/shipment.js'

const base: ShipmentInput = { category: 'shrimps', product: 'Vannamei', form: 'Easy Peel', quantityMt: 20, market: 'Japan', state: 'Frozen' }

test('containers = ceil(qty / payload)', () => {
  assert.equal(REEFER_PAYLOAD_MT, 25)
  for (const [q, c] of [[1, 1], [25, 1], [26, 2], [50, 2], [51, 3], [100, 4]]) assert.equal(planShipment({ ...base, quantityMt: q }).containers, c, `qty ${q}`)
})

test('quantity clamps to 1–100 and whole tonnes', () => {
  assert.equal(clampQty(0), 1)
  assert.equal(clampQty(-5), 1)
  assert.equal(clampQty(250), 100)
  assert.equal(clampQty(NaN), 1)
  assert.equal(clampQty(24.6), 25)
  assert.equal(planShipment({ ...base, quantityMt: 999 }).containers, 4)
})

test('cold line: frozen gets the cold-store range, fresh and chilled do not', () => {
  assert.equal(planShipment(base).coldLine, 'Held at −18 °C to −20 °C from Anandapuram to Japan.')
  for (const state of ['Raw fresh', 'Chilled'] as const) {
    const l = planShipment({ ...base, state }).coldLine
    assert.ok(!l.includes('−18'), l)
    assert.ok(l.endsWith('to Japan.'))
  }
})

test('documents checklist and quote pre-fill', () => {
  const p = planShipment(base)
  assert.deepEqual(p.documents, ['Export documents', 'Compliance (HACCP · EU · FDA)', 'Shipment tracking', 'Carton labels: product / size / batch / export compliance'])
  const q = new URLSearchParams(p.quoteHref.split('#')[1])
  assert.equal(q.get('species'), 'Vannamei')
  assert.equal(q.get('form'), 'Easy Peel')
  assert.equal(q.get('quantity'), '20 MT')
  assert.equal(q.get('destination'), 'Japan')
  assert.equal(q.get('state'), 'Frozen')
  assert.equal(new URLSearchParams(planShipment({ ...base, category: 'marine', product: 'Tuna' }).quoteHref.split('#')[1]).get('form'), null)
})

test('no prices, rates or transit promises in any output', () => {
  const text = JSON.stringify(planShipment(base))
  for (const bad of ['$', '₹', 'USD', 'price', 'rate', 'days', 'MOQ']) assert.ok(!text.includes(bad), bad)
})
