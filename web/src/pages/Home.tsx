import { Link } from 'react-router-dom'
import { CATEGORIES, CHALLENGES, challengesOf } from '../challenges'
import type { Challenge } from '../challenges/types'
import { useProgress, type Progress } from '../storage'

function StatusBadge({ progress, challenge }: { progress?: Progress; challenge: Challenge }) {
  if (challenge.kind === 'external') return <span className="badge external">extern</span>
  if (progress?.status === 'passed') return <span className="badge passed">✓ geschafft</span>
  if (progress) return <span className="badge started">in Arbeit</span>
  return null
}

export function Home() {
  const progress = useProgress()
  const trackable = CHALLENGES.filter((c) => c.kind !== 'external')
  const passed = trackable.filter((c) => progress[c.id]?.status === 'passed').length
  const next = trackable.find((c) => progress[c.id]?.status !== 'passed')

  return (
    <main className="page">
      <section className="hero">
        <div>
          <h1>Lerne Frontend-Entwicklung, eine Challenge nach der anderen.</h1>
          <p>
            Von der ersten HTML-Datei bis zum eigenen React-Hook: Lies die Aufgabe, schreib deinen Code direkt im
            Browser, sieh das Ergebnis live und bekomm sofort Feedback zu deiner Lösung.
          </p>
          {next && (
            <Link className="button primary large" to={`/challenge/${next.category}/${next.slug}`}>
              {passed === 0 ? 'Mit der ersten Challenge starten' : `Weiter mit „${next.title}“`} →
            </Link>
          )}
        </div>
        <div className="hero-progress" aria-label="Fortschritt">
          <div className="hero-progress-value">
            {passed}
            <span>/{trackable.length}</span>
          </div>
          <div>Challenges geschafft</div>
          <div className="progress">
            <span style={{ width: `${(passed / trackable.length) * 100}%` }} />
          </div>
        </div>
      </section>

      {CATEGORIES.map((category, index) => (
        <section key={category.id} className="category" id={category.id}>
          <header className="category-header">
            <span className="category-step">{index + 1}</span>
            <div>
              <h2>{category.title}</h2>
              <p>{category.description}</p>
            </div>
          </header>
          <ol className="cards">
            {challengesOf(category.id).map((challenge) => (
              <li key={challenge.id}>
                <Link className="card" to={`/challenge/${challenge.category}/${challenge.slug}`}>
                  <div className="card-top">
                    <span className="card-number">{String(challenge.number).padStart(2, '0')}</span>
                    <StatusBadge challenge={challenge} progress={progress[challenge.id]} />
                  </div>
                  <h3>{challenge.title}</h3>
                  <p>{challenge.summary}</p>
                  <ul className="topics">
                    {challenge.topics.map((topic) => (
                      <li key={topic}>{topic}</li>
                    ))}
                  </ul>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ))}

      <section className="category">
        <header className="category-header">
          <span className="category-step">+</span>
          <div>
            <h2>Weitere Challenges</h2>
            <p>
              Noch nicht genug? Bei <a href="https://adventofcode.com" target="_blank" rel="noreferrer">Advent of Code</a>{' '}
              wartet jeden Dezember ein neues Rätsel – perfekt, um JavaScript oder TypeScript zu trainieren.
            </p>
          </div>
        </header>
      </section>

      <footer className="page-footer">
        Entwickelt mit 💖 bei the peak lab · Dein Code und Fortschritt werden nur in deinem Browser gespeichert.
      </footer>
    </main>
  )
}
