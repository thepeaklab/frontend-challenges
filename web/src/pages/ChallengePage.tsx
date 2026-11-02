import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CATEGORIES, findChallenge, nextChallenge } from '../challenges'
import type { Challenge, CheckResult, Files } from '../challenges/types'
import { isPassed, runChecks } from '../checks/runner'
import { CheckList } from '../components/CheckList'
import { CodeEditor } from '../components/CodeEditor'
import { ConfirmButton } from '../components/ConfirmButton'
import { Markdown, readmeImages } from '../components/Markdown'
import { PreviewFrame, type ConsoleEntry } from '../components/PreviewFrame'
import { githubUrl, readme } from '../content/repo'
import { buildDocument, reactRuntimeUrl } from '../preview/build'
import { clearFiles, loadFiles, resetProgress, saveFiles, updateProgress, useProgress } from '../storage'

const PREVIEW_DEBOUNCE_MS = 500

export function ChallengePage() {
  const { category, slug } = useParams()
  const challenge = findChallenge(category ?? '', slug ?? '')

  if (!challenge) {
    return (
      <main className="page narrow">
        <h1>Challenge nicht gefunden</h1>
        <Link to="/">Zur Übersicht</Link>
      </main>
    )
  }
  return challenge.kind === 'external' ? (
    <ExternalChallenge key={challenge.id} challenge={challenge} />
  ) : (
    <Workspace key={challenge.id} challenge={challenge} />
  )
}

function Breadcrumb({ challenge }: { challenge: Challenge }) {
  const category = CATEGORIES.find((c) => c.id === challenge.category)
  const progress = useProgress()[challenge.id]
  return (
    <div className="breadcrumb">
      <Link to="/">Übersicht</Link>
      <span aria-hidden="true">/</span>
      <span>{category?.title}</span>
      <span aria-hidden="true">/</span>
      <strong>
        {String(challenge.number).padStart(2, '0')} · {challenge.title}
      </strong>
      {progress?.status === 'passed' && <span className="badge passed">✓ geschafft</span>}
    </div>
  )
}

function NextLink({ challenge }: { challenge: Challenge }) {
  const next = nextChallenge(challenge)
  if (!next) return null
  return (
    <Link className="next-link" to={`/challenge/${next.category}/${next.slug}`}>
      Nächste Challenge: <strong>{next.title}</strong> →
    </Link>
  )
}

function ExternalChallenge({ challenge }: { challenge: Challenge }) {
  return (
    <main className="page narrow">
      <Breadcrumb challenge={challenge} />
      <div className="callout">
        <p>
          Diese Challenge bearbeitest du außerhalb dieser Seite in deiner eigenen Entwicklungsumgebung. Hier findest du
          die Aufgabe und den Link zum Kurs.
        </p>
        <a className="button primary" href={challenge.externalUrl} target="_blank" rel="noreferrer">
          Zum Kurs-Repository ↗
        </a>
      </div>
      <Markdown source={readme(challenge.dir)} dir={challenge.dir} />
      <NextLink challenge={challenge} />
    </main>
  )
}

function sortFiles(challenge: Challenge, files: Files): string[] {
  const entry = challenge.entry
  return Object.keys(files).sort((a, b) => {
    if (a === entry) return -1
    if (b === entry) return 1
    return a.split('/').length - b.split('/').length || a.localeCompare(b)
  })
}

type InfoTab = 'task' | 'feedback'
type OutputTab = 'preview' | 'goal' | 'console'

function Workspace({ challenge }: { challenge: Challenge }) {
  const source = readme(challenge.dir)
  const [files, setFiles] = useState<Files>(() => loadFiles(challenge))
  const paths = useMemo(() => sortFiles(challenge, files), [challenge, files])
  const [activePath, setActivePath] = useState(() => challenge.entry && files[challenge.entry] !== undefined ? challenge.entry : paths[0])
  const [infoTab, setInfoTab] = useState<InfoTab>('task')
  const [outputTab, setOutputTab] = useState<OutputTab>('preview')
  const [results, setResults] = useState<CheckResult[]>()
  const [running, setRunning] = useState(false)
  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([])
  const [reloadCount, setReloadCount] = useState(0)
  const [previewDoc, setPreviewDoc] = useState(() =>
    buildDocument({ challenge, files, mode: 'preview', runtimeUrl: reactRuntimeUrl() }),
  )
  const edited = useRef(false)

  // Rebuild the preview and persist the code shortly after typing stops.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setConsoleEntries([])
      setPreviewDoc(buildDocument({ challenge, files, mode: 'preview', runtimeUrl: reactRuntimeUrl() }))
      if (edited.current) saveFiles(challenge, files)
    }, PREVIEW_DEBOUNCE_MS)
    return () => clearTimeout(timeout)
  }, [challenge, files])

  const updateFile = (path: string, value: string) => {
    if (!edited.current) {
      edited.current = true
      updateProgress(challenge.id, { status: 'started' })
    }
    setFiles((current) => ({ ...current, [path]: value }))
  }

  const runAllChecks = useCallback(async () => {
    setRunning(true)
    setInfoTab('feedback')
    try {
      const checkResults = await runChecks(challenge, files)
      setResults(checkResults)
      const required = checkResults.filter((r) => !r.optional)
      updateProgress(challenge.id, {
        status: isPassed(checkResults) ? 'passed' : 'started',
        passed: required.filter((r) => r.pass).length,
        total: required.length,
      })
    } finally {
      setRunning(false)
    }
  }, [challenge, files])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        event.stopPropagation()
        if (!running) void runAllChecks()
      }
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [runAllChecks, running])

  const reset = () => {
    clearFiles(challenge)
    resetProgress(challenge.id)
    edited.current = false
    setFiles(loadFiles(challenge))
    setResults(undefined)
  }

  const loadReference = () => {
    if (!challenge.reference) return
    edited.current = true
    setFiles((current) => ({ ...current, ...challenge.reference }))
  }

  const addConsoleEntry = useCallback((entry: ConsoleEntry) => setConsoleEntries((current) => [...current, entry]), [])
  const errorCount = consoleEntries.filter((e) => e.level === 'error').length
  const required = results?.filter((r) => !r.optional)
  const readOnly = challenge.readOnly?.includes(activePath) ?? false

  return (
    <main className="workspace">
      <section className="pane pane-info" aria-label="Aufgabe und Feedback">
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={infoTab === 'task'} onClick={() => setInfoTab('task')}>
            Aufgabe
          </button>
          <button role="tab" aria-selected={infoTab === 'feedback'} onClick={() => setInfoTab('feedback')}>
            Feedback
            {required && (
              <span className={`count ${isPassed(results!) ? 'success' : ''}`}>
                {required.filter((r) => r.pass).length}/{required.length}
              </span>
            )}
          </button>
        </div>
        <div className="pane-body">
          <Breadcrumb challenge={challenge} />
          {infoTab === 'task' ? (
            <Markdown source={source} dir={challenge.dir} />
          ) : (
            <CheckList results={results} running={running} onRun={runAllChecks} />
          )}
          <NextLink challenge={challenge} />
        </div>
      </section>

      <section className="pane pane-code" aria-label="Code">
        <div className="tabs code-header">
          <span className="pane-title">Code</span>
          <div className="toolbar-actions">
            <ConfirmButton confirmLabel="Wirklich zurücksetzen?" onConfirm={reset}>
              Zurücksetzen
            </ConfirmButton>
            <button className="button primary" onClick={runAllChecks} disabled={running} title="Strg/⌘ + Enter">
              {running ? 'Prüfe…' : '▶ Prüfen'}
            </button>
          </div>
        </div>
        <div className="file-tabs" role="tablist" aria-label="Dateien">
          {paths.map((path) => (
            <button key={path} role="tab" aria-selected={path === activePath} onClick={() => setActivePath(path)} title={path}>
              {challenge.readOnly?.includes(path) && <span aria-label="schreibgeschützt">🔒 </span>}
              {path}
            </button>
          ))}
        </div>
        {readOnly && <div className="notice">Das Markup dieser Challenge darf nicht verändert werden.</div>}
        <div className="editor-host">
          <CodeEditor
            key={activePath}
            path={activePath}
            value={files[activePath] ?? ''}
            readOnly={readOnly}
            onChange={(value) => updateFile(activePath, value)}
          />
        </div>
      </section>

      <section className="pane pane-output" aria-label="Ausgabe">
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={outputTab === 'preview'} onClick={() => setOutputTab('preview')}>
            Vorschau
          </button>
          <button role="tab" aria-selected={outputTab === 'goal'} onClick={() => setOutputTab('goal')}>
            Ziel
          </button>
          <button role="tab" aria-selected={outputTab === 'console'} onClick={() => setOutputTab('console')}>
            Konsole
            {consoleEntries.length > 0 && (
              <span className={`count ${errorCount ? 'error' : ''}`}>{consoleEntries.length}</span>
            )}
          </button>
          <button className="icon-button" onClick={() => setReloadCount((n) => n + 1)} title="Vorschau neu laden" aria-label="Vorschau neu laden">
            ↻
          </button>
        </div>
        <div className="output-body">
          <div className="preview-host" hidden={outputTab !== 'preview'}>
            <PreviewFrame key={reloadCount} srcDoc={previewDoc} title="Vorschau deiner Lösung" onConsole={addConsoleEntry} />
          </div>
          {outputTab === 'goal' && <Goal challenge={challenge} source={source} onLoadReference={loadReference} />}
          {outputTab === 'console' && <ConsoleView entries={consoleEntries} />}
        </div>
      </section>
    </main>
  )
}

function Goal({ challenge, source, onLoadReference }: { challenge: Challenge; source: string; onLoadReference: () => void }) {
  const [showReference, setShowReference] = useState(false)
  const images = readmeImages(source, challenge.dir)
  const referenceDoc = useMemo(
    () =>
      showReference && challenge.reference
        ? buildDocument({
            challenge,
            files: { ...challenge.files, ...challenge.reference },
            mode: 'preview',
            runtimeUrl: reactRuntimeUrl(),
          })
        : '',
    [challenge, showReference],
  )

  return (
    <div className="goal">
      {images.length > 0 && (
        <div className="goal-images">
          {images.map((image) => (
            <figure key={image.src}>
              <img src={image.src} alt={image.alt} loading="lazy" />
              {image.alt && <figcaption>{image.alt}</figcaption>}
            </figure>
          ))}
        </div>
      )}
      {challenge.reference ? (
        <div className="reference">
          <h3>Musterlösung</h3>
          <p>Versuch es erst selbst! Wenn du nicht weiterkommst, kannst du dir hier eine mögliche Lösung ansehen.</p>
          <div className="reference-actions">
            <button className="button" onClick={() => setShowReference((v) => !v)}>
              {showReference ? 'Musterlösung ausblenden' : 'Musterlösung live ansehen'}
            </button>
            <ConfirmButton confirmLabel="Deinen Code überschreiben?" onConfirm={onLoadReference}>
              In den Editor laden
            </ConfirmButton>
          </div>
          {showReference && (
            <div className="reference-frame">
              <PreviewFrame srcDoc={referenceDoc} title="Vorschau der Musterlösung" />
            </div>
          )}
        </div>
      ) : (
        <p className="muted">
          Für diese Challenge gibt es keine Musterlösung – hier zählt deine eigene Umsetzung. Den Quelltext der Aufgabe
          findest du <a href={githubUrl(challenge.dir)} target="_blank" rel="noreferrer">auf GitHub</a>.
        </p>
      )}
    </div>
  )
}

function ConsoleView({ entries }: { entries: ConsoleEntry[] }) {
  if (entries.length === 0) {
    return <p className="empty-state muted">Noch keine Ausgaben. Nutze console.log() in deinem Code.</p>
  }
  return (
    <ol className="console" aria-live="polite">
      {entries.map((entry, index) => (
        <li key={index} className={`console-entry ${entry.level}`}>
          <pre>{entry.text}</pre>
        </li>
      ))}
    </ol>
  )
}
