import './styles.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Footer, Header } from './ui'
import { ScrollTrigger, lenis } from './scroll'

function Home() {
  return (
    <>
      <main id="main" className="light" tabIndex={-1}>
      </main>
      <Footer />
    </>
  )
}

createRoot(document.getElementById('head')!).render(<StrictMode><Header /></StrictMode>)
createRoot(document.getElementById('app')!).render(<StrictMode><Home /></StrictMode>)

// after the content mounts: measure triggers, then honour a hash (#chain, #builder …) at its final position, immediately
requestAnimationFrame(() => {
  ScrollTrigger.refresh()
  const target = location.hash && document.querySelector(location.hash)
  if (target) lenis ? lenis.scrollTo(target as HTMLElement, { immediate: true, offset: 0 }) : target.scrollIntoView()
})
