import { useEffect, useState } from 'react'
import { CONTACT } from './config/content'

export const PROFILE_PDF = '/docs/skylark-exim-company-profile.pdf'
const LINKS = [
  { label: 'Story', href: '/#chain' },
  { label: 'Products', href: '/#products' },
  { label: 'Markets', href: '/#markets' },
  { label: 'Company profile', href: PROFILE_PDF },
  { label: 'Contact', href: '/#contact' },
]

/** S0: full-width bar at the top, a floating pill once the page scrolls. The pill is solid, and every section keeps --clear of top padding. */
export function Header() {
  const [pill, setPill] = useState(false)
  useEffect(() => {
    const on = () => setPill(scrollY > 40)
    on()
    addEventListener('scroll', on, { passive: true })
    return () => removeEventListener('scroll', on)
  }, [])
  return (
    <header className={`site-head${pill ? ' is-pill' : ''}`}>
      <div className="site-head__bar">
        <a className="brand" href="/" aria-label="Skylark Exim, home">
          <img src="/logo-128.webp" width="36" height="36" alt="" />
          Skylark Exim
        </a>
        <nav className="site-nav" aria-label="Site">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}>{l.label}</a>
          ))}
        </nav>
        <details className="menu">
          <summary aria-label="Menu">Menu</summary>
          <nav className="menu__list" aria-label="Site (mobile)">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href}>{l.label}</a>
            ))}
            <a href="/quote">Request export quote</a>
          </nav>
        </details>
        <a className="btn btn--solid" href="/quote">Request export quote</a>
      </div>
    </header>
  )
}

/**
 * S9: the one footer, identical on every page (public/order.html and public/404.html carry the same markup by hand;
 * tests/site.spec.ts compares them). Never reveal-gated: it is visible the moment anyone lands at the bottom.
 */
export function Footer() {
  return (
    <footer className="site-foot" id="contact">
      <div className="site-foot__in">
        <h2>Contact</h2>
        <div className="site-foot__grid">
          <div>
            <h3>Write or call</h3>
            <ul>
              <li><a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></li>
              {CONTACT.phones.map((p) => (
                <li key={p.tel}><a href={`tel:${p.tel}`}>{p.label}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Office</h3>
            <p>{CONTACT.office}</p>
          </div>
          <div>
            <h3>Processing unit</h3>
            <p>{CONTACT.unit}</p>
          </div>
          <div>
            <h3>Work with us</h3>
            <ul>
              <li><a href="/quote">Request export quote</a></li>
              <li><a href="/order">Place an order</a></li>
              <li><a href={PROFILE_PDF}>Company profile (PDF)</a></li>
            </ul>
          </div>
        </div>
        <div className="site-foot__base">
          <span>© Skylark Exim</span>
          <span>Visakhapatnam, Andhra Pradesh</span>
        </div>
      </div>
    </footer>
  )
}
