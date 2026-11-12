import './styles.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CONTACT } from './config/content'
import RfqForm from './RfqForm'
import { Footer, Header } from './ui'

// The heading is static in quote.html (it paints before this script); React fills the header, form and footer.
createRoot(document.getElementById('head')!).render(<StrictMode><Header solid /></StrictMode>)
createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <div className="quote-layout">
      <RfqForm />
      <aside className="quote-aside" aria-label="Office">
        <h2>Office</h2>
        <p>{CONTACT.office}</p>
        <h2>Email</h2>
        <p><a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></p>
        <h2>Ready to order?</h2>
        <p><a href="/order">Build a full order →</a></p>
      </aside>
    </div>
  </StrictMode>,
)
createRoot(document.getElementById('foot')!).render(<StrictMode><Footer /></StrictMode>)
