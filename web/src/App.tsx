import { lazy, Suspense, useEffect } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import { Home } from './pages/Home'
import { REPO_URL } from './content/repo'

// The workspace (editor, transpiler, markdown) is only loaded when a challenge is opened.
const ChallengePage = lazy(() => import('./pages/ChallengePage').then((m) => ({ default: m.ChallengePage })))

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export function App() {
  return (
    <div className="app">
      <ScrollToTop />
      <header className="topbar">
        <Link to="/" className="brand">
          <span aria-hidden="true">⛰️</span> Frontend Challenges
        </Link>
        <nav className="topbar-nav">
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            GitHub
          </a>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/challenge/:category/:slug"
          element={
            <Suspense fallback={<main className="page muted">Lade Challenge…</main>}>
              <ChallengePage />
            </Suspense>
          }
        />
        <Route
          path="*"
          element={
            <main className="page narrow">
              <h1>Seite nicht gefunden</h1>
              <Link to="/">Zur Übersicht</Link>
            </main>
          }
        />
      </Routes>
    </div>
  )
}
