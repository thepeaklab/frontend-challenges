import type { CheckResult } from '../challenges/types'

interface Props {
  results?: CheckResult[]
  running: boolean
  onRun: () => void
}

function groupByTask(results: CheckResult[]): [string | undefined, CheckResult[]][] {
  const groups = new Map<string | undefined, CheckResult[]>()
  for (const result of results) groups.set(result.task, [...(groups.get(result.task) ?? []), result])
  return Array.from(groups)
}

export function CheckList({ results, running, onRun }: Props) {
  if (!results) {
    return (
      <div className="empty-state">
        <p>Prüfe deine Lösung, um Feedback zu den Anforderungen der Challenge zu bekommen.</p>
        <button className="button primary" onClick={onRun} disabled={running}>
          {running ? 'Prüfe…' : 'Lösung prüfen'}
        </button>
      </div>
    )
  }

  const required = results.filter((r) => !r.optional)
  const passed = required.filter((r) => r.pass).length
  const done = passed === required.length

  return (
    <div className={`checks${running ? ' is-running' : ''}`}>
      <div className={`checks-summary ${done ? 'success' : ''}`} role="status">
        <strong>{done ? '🎉 Geschafft! Alle Anforderungen sind erfüllt.' : `${passed} von ${required.length} Anforderungen erfüllt`}</strong>
        <div className="progress" aria-hidden="true">
          <span style={{ width: `${required.length ? (passed / required.length) * 100 : 0}%` }} />
        </div>
      </div>
      {groupByTask(results).map(([task, items]) => (
        <section key={task ?? 'default'} className="check-group">
          {task && <h3>{task}</h3>}
          <ul>
            {items.map((result) => (
              <li key={result.id} className={`check ${result.pass ? 'pass' : 'fail'} ${result.optional ? 'optional' : ''}`}>
                <span className="check-icon" aria-label={result.pass ? 'erfüllt' : 'nicht erfüllt'}>
                  {result.pass ? '✓' : result.optional ? '○' : '✗'}
                </span>
                <div>
                  <div className="check-title">
                    {result.title}
                    {result.optional && <span className="tag">optional</span>}
                  </div>
                  {result.message && <div className="check-message">{result.message}</div>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
