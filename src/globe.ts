import { BufferGeometry, Color, Group, Line, LineBasicMaterial, Mesh, MeshBasicMaterial, PerspectiveCamera, QuadraticBezierCurve3, SRGBColorSpace, Scene, SphereGeometry, TextureLoader, Vector3, WebGLRenderer } from 'three'
import { MARKET_COORDS, ORIGIN } from './config/markets'

/**
 * The page's only WebGL context (S4, ACROSS THE WORLD). Plain three.js, no React renderer: the source repo's Globe.tsx
 * is welded to its film engine (ticker, scroll store), so this keeps its data and geometry (src/three/geo.ts: latLon,
 * routePoints) and drops the rest. Renders only while visible and its tab is active; DPR capped at 1.5.
 */
const D = Math.PI / 180
const latLon = (lat: number, lon: number, r = 1) => {
  const phi = (90 - lat) * D
  const theta = (lon + 180) * D
  return new Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta))
}
const route = (from: Vector3, to: Vector3, n = 64, lift = 0.25) => {
  const mid = from.clone().add(to).normalize().multiplyScalar(1 + lift * from.angleTo(to))
  return new QuadraticBezierCurve3(from, mid, to).getPoints(n)
}

export function mountGlobe(host: HTMLElement) {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
  renderer.outputColorSpace = SRGBColorSpace
  host.append(renderer.domElement)
  const scene = new Scene()
  const camera = new PerspectiveCamera(35, 1, 0.1, 100)
  camera.position.z = 3.6

  const globe = new Group()
  scene.add(globe)
  const earth = new Mesh(new SphereGeometry(1, 96, 64), new MeshBasicMaterial({ color: new Color('#1d4b57') }))
  globe.add(earth)
  new TextureLoader().load('/textures/earth_day_2048.webp', (t) => {
    t.colorSpace = SRGBColorSpace
    t.anisotropy = 4
    earth.material = new MeshBasicMaterial({ map: t })
  })
  const o = latLon(ORIGIN.lat, ORIGIN.lon, 1.003)
  const dotGeo = new SphereGeometry(0.014, 12, 8)
  const brass = new MeshBasicMaterial({ color: '#e08a5f' })
  const cold = new MeshBasicMaterial({ color: '#5fc3b4' })
  const lineMat = new LineBasicMaterial({ color: '#5fc3b4', transparent: true, opacity: 0.9 })
  for (const m of MARKET_COORDS) {
    const p = latLon(m.lat, m.lon, 1.003)
    globe.add(new Line(new BufferGeometry().setFromPoints(route(o, p)), lineMat))
    const dot = new Mesh(dotGeo, brass)
    dot.position.copy(p)
    globe.add(dot)
  }
  const origin = new Mesh(new SphereGeometry(0.022, 12, 8), cold)
  origin.position.copy(o)
  globe.add(origin)

  // settled view: centred between Algeria and Japan (the source's C_LON 70 / C_LAT 24)
  const c = latLon(24, 70)
  let rotY = -Math.atan2(c.x, c.z)
  let rotX = 24 * D
  let vel = 0.0015 // gentle idle turn
  let running = false
  let visible = false
  let active = false
  let raf = 0

  const resize = () => {
    const s = host.clientWidth
    renderer.setSize(s, s, false)
    camera.aspect = 1
    camera.updateProjectionMatrix()
  }
  const ro = new ResizeObserver(resize)
  ro.observe(host)
  resize()

  const loop = () => {
    raf = requestAnimationFrame(loop)
    if (!drag) rotY += vel
    globe.rotation.set(rotX, rotY, 0)
    renderer.render(scene, camera)
  }
  const sync = () => {
    const want = visible && active
    if (want && !running) (running = true), loop()
    if (!want && running) (running = false), cancelAnimationFrame(raf)
  }
  const io = new IntersectionObserver(([e]) => ((visible = e.isIntersecting), sync()))
  io.observe(host)

  // drag (pointer) and arrow keys
  let drag: { x: number; y: number } | null = null
  host.addEventListener('pointerdown', (e) => {
    drag = { x: e.clientX, y: e.clientY }
    host.setPointerCapture(e.pointerId)
  })
  host.addEventListener('pointermove', (e) => {
    if (!drag) return
    rotY += (e.clientX - drag.x) * 0.006
    rotX = Math.max(-0.6, Math.min(0.9, rotX + (e.clientY - drag.y) * 0.004))
    drag = { x: e.clientX, y: e.clientY }
    vel = 0
  })
  host.addEventListener('pointerup', () => (drag = null))
  host.addEventListener('pointercancel', () => (drag = null))
  host.addEventListener('keydown', (e) => {
    const step = { ArrowLeft: [-0.15, 0], ArrowRight: [0.15, 0], ArrowUp: [0, -0.1], ArrowDown: [0, 0.1] }[e.key]
    if (!step) return
    e.preventDefault()
    rotY += step[0]
    rotX = Math.max(-0.6, Math.min(0.9, rotX + step[1]))
    vel = 0
  })

  return {
    setActive(on: boolean) {
      active = on
      sync()
    },
    dispose() {
      cancelAnimationFrame(raf)
      io.disconnect()
      ro.disconnect()
      renderer.dispose()
      renderer.forceContextLoss()
      renderer.domElement.remove()
    },
  }
}
