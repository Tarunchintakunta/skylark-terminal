import './styles.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CONTACT } from './config/content'
import RfqForm from './RfqForm'
import { Footer, Header } from './ui'

function Quote() {
  return (
    <>
      <Header solid />
      <main id="main" className="page">
        <p className="mono sec__num">Quote</p>
        <h1>Request an export quote</h1>
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
      </main>
      <Footer />
    </>
  )
}

createRoot(document.getElementById('app')!).render(<StrictMode><Quote /></StrictMode>)
