import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { MARINE_FISH, SHRIMPS } from './config/content'
import { CATEGORIES, SHRIMP_FORMS, STATES } from './config/products'
import { RFQ_TO, rfqSchema, rfqSubject, rfqSummary, type Rfq, type RfqInput } from './config/rfq'

/**
 * The RFQ form, from skylark-exim-v3 src/sections/RfqForm.tsx: validated → api/rfq (Resend) or, without
 * RESEND_API_KEY / RFQ_FROM, a pre-filled mailto to info@skylarkexim.com. Pre-fill comes from the URL hash the
 * shipment builder writes (#category=…&species=…&form=…&state=…&quantity=…&destination=…); unknown values are dropped.
 */
type Status = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent' } | { kind: 'mailto'; href: string } | { kind: 'error'; msg: string }

const FORMS = SHRIMP_FORMS.map((f) => f.name)

export function readPrefill(hash: string) {
  const q = new URLSearchParams(hash.replace(/^#/, ''))
  const c = q.get('category')
  const category: 'marine' | 'shrimps' | undefined = c === 'shrimps' || c === 'marine' ? c : undefined
  const list: readonly string[] = category === 'shrimps' ? SHRIMPS : category === 'marine' ? MARINE_FISH : []
  const pick = (v: string | null, allowed: readonly string[]) => (v && allowed.includes(v) ? [v] : [])
  return {
    category,
    species: pick(q.get('species'), list),
    forms: category === 'shrimps' ? pick(q.get('form'), FORMS) : [],
    states: pick(q.get('state'), STATES),
    quantity: (q.get('quantity') ?? '').slice(0, 120),
    destination: (q.get('destination') ?? '').slice(0, 120),
  }
}

export default function RfqForm() {
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const doneRef = useRef<HTMLHeadingElement>(null)
  const [pre] = useState(() => readPrefill(location.hash))
  const fromBuilder = !!pre.category
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<RfqInput, unknown, Rfq>({
    resolver: zodResolver(rfqSchema),
    defaultValues: { category: pre.category ?? 'marine', species: pre.species, forms: pre.forms, states: pre.states, quantity: pre.quantity, destination: pre.destination },
  })
  const category = useWatch({ control, name: 'category' })

  useEffect(() => {
    if (status.kind === 'sent' || status.kind === 'mailto') doneRef.current?.focus()
  }, [status.kind])

  const onSubmit = async (r: Rfq) => {
    setStatus({ kind: 'sending' })
    const mailto = `mailto:${RFQ_TO}?subject=${encodeURIComponent(rfqSubject(r))}&body=${encodeURIComponent(rfqSummary(r))}`
    try {
      const res = await fetch('/api/rfq', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(r) })
      const body = await res.json().catch(() => ({}))
      if (body.ok) return setStatus({ kind: 'sent' })
      if (res.status === 429) return setStatus({ kind: 'error', msg: 'Too many requests. Please try again in a few minutes, or email us directly.' })
      if (!body.fallback) throw new Error('rfq failed')
    } catch {
      // API unreachable: still let the buyer send it from their own email app
    }
    setStatus({ kind: 'mailto', href: mailto })
    window.location.href = mailto
  }

  const field = (name: 'name' | 'company' | 'country' | 'email' | 'phone' | 'quantity' | 'destination', label: string, type = 'text', auto?: string) => (
    <label className={`field${errors[name] ? ' is-invalid' : ''}`}>
      <span>{label}</span>
      <input type={type} autoComplete={auto} aria-invalid={!!errors[name]} {...register(name)} />
      {errors[name] && <span className="field__error" role="alert">{errors[name]?.message}</span>}
    </label>
  )
  const checks = (name: 'species' | 'forms' | 'states', options: readonly string[], legend: string) => (
    <fieldset className="checks">
      <legend>{legend}</legend>
      {options.map((o) => (
        <label key={o} className="check">
          <input type="checkbox" value={o} {...register(name)} />
          <span>{o}</span>
        </label>
      ))}
    </fieldset>
  )

  return status.kind === 'sent' || status.kind === 'mailto' ? (
    <div className="rfq-done" role="status">
      <h2 ref={doneRef} tabIndex={-1} style={{ fontSize: 'var(--fs-h3)' }}>{status.kind === 'sent' ? 'Thank you. Your request is with our team.' : 'Your email app should open with the request.'}</h2>
      {status.kind === 'mailto' && (
        <p>
          If it didn’t, <a href={status.href}>open the pre-filled email</a> or write to <a href={`mailto:${RFQ_TO}`}>{RFQ_TO}</a>.
        </p>
      )}
      <button className="btn" type="button" onClick={() => (reset(), setStatus({ kind: 'idle' }))}>Send another request</button>
    </div>
  ) : (
    <form id="quote-form" className="rfq" onSubmit={handleSubmit(onSubmit)} noValidate>
      {fromBuilder && <p className="prefill">Filled in from the shipment builder. Check the details, add your contact, and send.</p>}
      <div className="rfq__row">
        {field('name', 'Name', 'text', 'name')}
        {field('company', 'Company', 'text', 'organization')}
      </div>
      <div className="rfq__row">
        {field('country', 'Country', 'text', 'country-name')}
        {field('email', 'Email', 'email', 'email')}
      </div>
      <div className="rfq__row">
        {field('phone', 'Phone (optional)', 'tel', 'tel')}
        <label className="field">
          <span>Product category</span>
          <select {...register('category')}>
            <option value="marine">{CATEGORIES.marine.label}</option>
            <option value="shrimps">{CATEGORIES.shrimps.label}</option>
          </select>
        </label>
      </div>
      {checks('species', category === 'shrimps' ? SHRIMPS : MARINE_FISH, 'Species')}
      {category === 'shrimps' && checks('forms', FORMS, 'Form')}
      {checks('states', STATES, 'Fresh / chilled / frozen')}
      <div className="rfq__row">
        {field('quantity', 'Quantity')}
        {field('destination', 'Destination market')}
      </div>
      <label className={`field${errors.message ? ' is-invalid' : ''}`}>
        <span>Message</span>
        <textarea rows={4} {...register('message')} />
        {errors.message && <span className="field__error" role="alert">{errors.message.message}</span>}
      </label>
      <label className="hp" aria-hidden="true">
        Website <input tabIndex={-1} autoComplete="off" {...register('website')} />
      </label>
      {status.kind === 'error' && <p className="field__error" role="alert">{status.msg}</p>}
      <button className="btn btn--ink" type="submit" disabled={status.kind === 'sending'}>{status.kind === 'sending' ? 'Sending…' : 'Send request'}</button>
    </form>
  )
}
