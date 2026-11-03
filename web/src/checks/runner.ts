import type { Challenge, CheckContext, CheckResult, Files, FrameWindow } from '../challenges/types'
import { buildDocument, reactRuntimeUrl } from '../preview/build'

const CHECK_TIMEOUT_MS = 8000
const LOAD_TIMEOUT_MS = 15000

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

async function waitFor<T>(fn: () => T, timeout = 3000): Promise<T | undefined> {
  const start = Date.now()
  for (;;) {
    try {
      const value = fn()
      if (value) return value
    } catch {
      // keep polling
    }
    if (Date.now() - start > timeout) return undefined
    await wait(50)
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    wait(ms).then(() => {
      throw new Error(`Zeitüberschreitung nach ${ms / 1000}s`)
    }),
  ])
}

/** Renders the learner's code in a hidden frame and evaluates all checks of the challenge. */
export async function runChecks(challenge: Challenge, files: Files): Promise<CheckResult[]> {
  const frame = document.createElement('iframe')
  frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-modals')
  frame.setAttribute('aria-hidden', 'true')
  frame.tabIndex = -1
  Object.assign(frame.style, {
    position: 'fixed',
    left: '-20000px',
    top: '0',
    width: '1280px',
    height: '800px',
    border: '0',
    pointerEvents: 'none',
  })

  const loaded = new Promise<void>((resolve) => frame.addEventListener('load', () => resolve(), { once: true }))
  frame.srcdoc = buildDocument({ challenge, files, mode: 'test', runtimeUrl: reactRuntimeUrl() })
  document.body.appendChild(frame)

  try {
    await withTimeout(loaded, LOAD_TIMEOUT_MS)
    const win = frame.contentWindow as FrameWindow
    const doc = frame.contentDocument!
    const ctx: CheckContext = { win, doc, files, wait, waitFor }

    if (challenge.kind === 'react') await waitFor(() => doc.getElementById('root')?.childElementCount, 2000)
    await wait(challenge.settleMs ?? 100)

    const results: CheckResult[] = []
    for (const check of challenge.checks ?? []) {
      const base = { id: check.id, task: check.task, title: check.title, optional: check.optional }
      try {
        const outcome = await withTimeout(Promise.resolve(check.run(ctx)), CHECK_TIMEOUT_MS)
        results.push({ ...base, ...(typeof outcome === 'boolean' ? { pass: outcome } : outcome) })
      } catch (error) {
        results.push({ ...base, pass: false, message: `Fehler beim Prüfen: ${(error as Error).message ?? error}` })
      }
    }
    return results
  } finally {
    frame.remove()
  }
}

export function isPassed(results: CheckResult[]): boolean {
  return results.length > 0 && results.every((result) => result.pass || result.optional)
}
