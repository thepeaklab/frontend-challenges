import { fail, pass } from '../checks/helpers'
import { WEATHER_TEST_BOOTSTRAP } from '../checks/weather-fixture'
import { weatherChecks } from './js'
import { reference } from './reference'
import type { Challenge, CheckContext, CheckOutcome } from './types'

const MAIN_TSX = `import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
`

function buttons(ctx: CheckContext): HTMLButtonElement[] {
  return Array.from(ctx.doc.querySelectorAll<HTMLButtonElement>('#root button'))
}

/** The number shown on each button (last number in its text). */
function counts(ctx: CheckContext): number[] {
  return buttons(ctx).map((button) => {
    const numbers = button.textContent?.match(/-?\d+/g)
    return numbers ? Number(numbers[numbers.length - 1]) : NaN
  })
}

const sameCounts = (a: number[], b: number[]) => a.length === b.length && a.every((n, i) => n === b[i])

/**
 * Clicks a button and returns how each count changed. Retries when the
 * 2-second interval fired in between, which would distort the deltas.
 */
async function clickDeltas(ctx: CheckContext, index: number): Promise<number[]> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const before = counts(ctx)
    buttons(ctx)[index].click()
    await ctx.wait(30)
    const after = counts(ctx)
    const deltas = after.map((n, i) => n - before[i])
    const intervalFired = deltas.every((d) => d >= 1) && deltas.some((d, i) => i !== index && d >= 1) && deltas[index] >= 2
    if (!intervalFired) return deltas
    await ctx.wait(100)
  }
  throw new Error('Die Zählerstände ändern sich zu schnell, um Klicks zu prüfen.')
}

async function classifyButtons(ctx: CheckContext): Promise<{ single: number[]; all: number[]; other: string[] }> {
  const result = { single: [] as number[], all: [] as number[], other: [] as string[] }
  const total = buttons(ctx).length
  for (let i = 0; i < total; i++) {
    const deltas = await clickDeltas(ctx, i)
    if (deltas.every((d) => d === 1)) result.all.push(i)
    else if (deltas[i] === 1 && deltas.every((d, j) => j === i || d === 0)) result.single.push(i)
    else result.other.push(`Button ${i + 1}: Änderungen ${deltas.map((d) => (d >= 0 ? `+${d}` : d)).join(' / ')}`)
  }
  return result
}

const makeItCount: Challenge = {
  id: 'react/01_make_it_count',
  category: 'react',
  slug: '01_make_it_count',
  number: 1,
  title: 'Make it Count',
  summary: 'Drei Zähler mit einem Kniff: geteilter State und ein Intervall.',
  topics: ['useState', 'useEffect', 'State teilen'],
  kind: 'react',
  dir: 'react/01_make_it_count',
  entry: 'main.tsx',
  files: {
    'main.tsx': MAIN_TSX,
    'App.tsx': `export default function App() {
  return (
    <main>
      <h1>Make it Count!</h1>
      {/* Deine drei Buttons */}
    </main>
  )
}
`,
    'styles.css': `body {
  font-family: system-ui, sans-serif;
  text-align: center;
}
`,
  },
  reference: reference('react/01_make_it_count'),
  checks: [
    {
      id: 'buttons',
      title: 'Die App zeigt drei Buttons',
      run: (ctx) => {
        const count = buttons(ctx).length
        return count === 3 ? pass() : fail(`Es werden ${count} Buttons angezeigt.`)
      },
    },
    {
      id: 'counts',
      title: 'Jeder Button zeigt seinen Zählerstand',
      run: (ctx) => {
        const values = counts(ctx)
        if (values.length === 0) return fail('Keine Buttons gefunden.')
        return values.every((n) => !Number.isNaN(n))
          ? pass(`Aktuell: ${values.join(' / ')}`)
          : fail('Mindestens ein Button zeigt keine Zahl an, z.B. „count is 0“.')
      },
    },
    {
      id: 'click',
      title: 'Klicks: zwei Buttons zählen nur sich selbst, einer zählt alle hoch',
      run: async (ctx): Promise<CheckOutcome> => {
        if (buttons(ctx).length !== 3) return fail('Dafür werden genau drei Buttons benötigt.')
        const { single, all, other } = await classifyButtons(ctx)
        if (single.length === 2 && all.length === 1) return pass(`Button ${all[0] + 1} erhöht alle Zähler.`)
        return fail(
          [
            `${single.length} Button(s) zählen nur sich selbst (erwartet 2), ${all.length} zählen alle hoch (erwartet 1).`,
            ...other,
          ].join(' '),
        )
      },
    },
    {
      id: 'interval',
      title: 'Alle 2 Sekunden werden alle Zähler um 1 erhöht',
      run: async (ctx): Promise<CheckOutcome> => {
        const ticks: { at: number; deltas: number[] }[] = []
        let last = counts(ctx)
        const start = Date.now()
        while (Date.now() - start < 4600 && ticks.length < 2) {
          await ctx.wait(40)
          const now = counts(ctx)
          if (!sameCounts(now, last)) {
            ticks.push({ at: Date.now(), deltas: now.map((n, i) => n - last[i]) })
            last = now
          }
        }
        if (ticks.length === 0) return fail('In 4,5 Sekunden hat sich kein Zähler von selbst verändert. Tipp: setInterval in useEffect.')
        const doubled = ticks.some((tick) => tick.deltas.some((d) => d > 1))
        if (doubled) {
          return fail(
            'Die Zähler springen um mehr als 1. Läuft das Intervall doppelt? StrictMode führt Effekte zweimal aus – gib in useEffect eine Cleanup-Funktion (clearInterval) zurück.',
          )
        }
        if (ticks.some((tick) => tick.deltas.some((d) => d !== 1))) return fail('Beim Intervall werden nicht alle Zähler erhöht.')
        if (ticks.length < 2) return fail('Das Intervall hat nur einmal ausgelöst.')
        const gap = ticks[1].at - ticks[0].at
        return gap > 1600 && gap < 2500 ? pass() : fail(`Zwischen zwei Erhöhungen lagen ${(gap / 1000).toFixed(1)}s statt 2s.`)
      },
    },
  ],
}

type HookResult = Record<string, unknown> | unknown[] | null | undefined

/** Reads the status of a useFetch result regardless of its exact shape. */
function statusOf(result: HookResult): 'loading' | 'success' | 'error' | 'idle' | undefined {
  if (!result || typeof result !== 'object' || Array.isArray(result)) return undefined
  const r = result as Record<string, unknown>
  const status = r.status ?? r.state
  if (typeof status === 'string' && /^(loading|success|error|idle)$/.test(status)) return status as never
  if (r.loading === true || r.isLoading === true) return 'loading'
  if (r.isError === true || (r.error && r.loading === false) || (r.error && r.isLoading === false)) return 'error'
  if (r.isSuccess === true || (r.data !== undefined && r.data !== null && (r.loading === false || r.isLoading === false)))
    return 'success'
  return undefined
}

interface Probe {
  results: HookResult[]
  unmount: () => void
}

/** Mounts a component inside the frame that calls the learner's useFetch and records every result. */
function mountProbe(ctx: CheckContext, url: string, options: RequestInit): Probe {
  const modules = ctx.win.__fcModules!
  const React = modules.react
  const { createRoot } = modules['react-dom/client']
  const exports = ctx.win.__fc.require('./useFetch')
  const useFetch = (exports.useFetch ?? exports.default) as (url: string, options?: RequestInit) => HookResult
  if (typeof useFetch !== 'function') throw new Error('useFetch.ts exportiert keine Funktion useFetch.')

  const results: HookResult[] = []
  function ProbeComponent() {
    results.push(useFetch(url, options))
    return null
  }
  const container = ctx.doc.createElement('div')
  ctx.doc.body.appendChild(container)
  const root = createRoot(container)
  root.render(React.createElement(ProbeComponent))
  return {
    results,
    unmount: () => {
      root.unmount()
      container.remove()
    },
  }
}

interface FetchMock {
  calls: { url: string; init?: RequestInit }[]
  restore: () => void
}

function mockFetch(ctx: CheckContext, respond: (url: string) => Promise<Response>): FetchMock {
  const bridge = ctx.win.__fc as unknown as { mockFetch?: unknown }
  const previous = bridge.mockFetch
  const calls: FetchMock['calls'] = []
  bridge.mockFetch = (input: RequestInfo, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.url
    calls.push({ url, init })
    if (calls.length > 50) return Promise.reject(new Error('Zu viele Anfragen'))
    return respond(url)
  }
  return { calls, restore: () => (bridge.mockFetch = previous) }
}

const jsonResponse = (ctx: CheckContext, body: unknown, status = 200) =>
  new Promise<Response>((resolve) =>
    setTimeout(
      () => resolve(new ctx.win.Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })),
      30,
    ),
  )

function withProbe(
  ctx: CheckContext,
  respond: (url: string) => Promise<Response>,
  test: (probe: Probe, fetchMock: FetchMock) => Promise<CheckOutcome>,
  url = 'https://example.test/data',
  options: RequestInit = { headers: { Accept: 'application/json' } },
): Promise<CheckOutcome> {
  const fetchMock = mockFetch(ctx, respond)
  const probe = mountProbe(ctx, url, options)
  return test(probe, fetchMock).finally(() => {
    probe.unmount()
    fetchMock.restore()
  })
}

const PAYLOAD = { message: 'hallo', items: [1, 2, 3] }

const reactiveWeather: Challenge = {
  id: 'react/02_reactive_weather',
  category: 'react',
  slug: '02_reactive_weather',
  number: 2,
  title: 'Reactive Weather',
  summary: 'Die Wetter-App als React-App – mit einem eigenen useFetch-Hook.',
  topics: ['Custom Hooks', 'fetch', 'Caching'],
  kind: 'react',
  dir: 'react/02_reactive_weather',
  entry: 'main.tsx',
  testBootstrap: WEATHER_TEST_BOOTSTRAP,
  files: {
    'main.tsx': MAIN_TSX,
    'App.tsx': `import { useFetch } from './useFetch'

export default function App() {
  return <main>Deine Wetter-App</main>
}
`,
    'useFetch.ts': `export function useFetch<T = unknown>(url: string, options?: RequestInit) {
  // Gib data, error und einen status ('loading' | 'success' | 'error') zurück
}
`,
    'styles.css': `body {
  font-family: system-ui, sans-serif;
}
`,
  },
  reference: reference('react/02_reactive_weather'),
  checks: [
    {
      id: 'export',
      task: 'useFetch',
      title: 'useFetch.ts exportiert den Hook useFetch',
      run: ({ win }) => {
        const exports = win.__fc.require('./useFetch')
        return typeof (exports.useFetch ?? exports.default) === 'function'
          ? pass()
          : fail('Exportiere eine Funktion: export function useFetch(url, options) { … }')
      },
    },
    {
      id: 'success',
      task: 'useFetch',
      title: 'Lädt Daten und meldet loading → success',
      run: (ctx) =>
        withProbe(
          ctx,
          () => jsonResponse(ctx, PAYLOAD),
          async ({ results }, { calls }) => {
            const done = await ctx.waitFor(() => results.find((r) => statusOf(r) === 'success'), 2000)
            if (!calls.length) return fail('Der Hook ruft fetch nicht auf.')
            if (!results.some((r) => statusOf(r) === 'loading'))
              return fail('Während der Anfrage fehlt ein Lade-Status (z.B. status: "loading" oder isLoading: true).')
            if (!done) return fail('Nach der Antwort wird kein Erfolgs-Status gemeldet (z.B. status: "success").')
            const data = (done as Record<string, unknown>).data
            return JSON.stringify(data) === JSON.stringify(PAYLOAD)
              ? pass()
              : fail(`data enthält ${JSON.stringify(data)} statt der JSON-Antwort ${JSON.stringify(PAYLOAD)}.`)
          },
        ),
    },
    {
      id: 'arguments',
      task: 'useFetch',
      title: 'url und options werden an fetch übergeben',
      run: (ctx) => {
        const options = { headers: { 'X-Test': '1' } }
        return withProbe(
          ctx,
          () => jsonResponse(ctx, PAYLOAD),
          async (_probe, { calls }) => {
            await ctx.waitFor(() => calls.length > 0, 1000)
            const call = calls[0]
            if (!call) return fail('Der Hook ruft fetch nicht auf.')
            if (call.url !== 'https://example.test/args') return fail(`fetch wurde mit „${call.url}“ aufgerufen.`)
            return JSON.stringify(call.init?.headers) === JSON.stringify(options.headers)
              ? pass()
              : fail('Die übergebenen options kommen nicht bei fetch an.')
          },
          'https://example.test/args',
          options,
        )
      },
    },
    {
      id: 'error',
      task: 'useFetch',
      title: 'Meldet Fehler mit status error',
      run: (ctx) =>
        withProbe(
          ctx,
          () => Promise.reject(new ctx.win.TypeError('Failed to fetch')),
          async ({ results }) => {
            const failed = await ctx.waitFor(() => results.find((r) => statusOf(r) === 'error'), 2000)
            if (!failed) return fail('Schlägt die Anfrage fehl, sollte der Hook einen Fehler-Status liefern (z.B. status: "error").')
            return (failed as Record<string, unknown>).error
              ? pass()
              : fail('Der Status ist „error“, aber der Fehler selbst wird nicht zurückgegeben.')
          },
          'https://example.test/broken',
        ),
    },
    {
      id: 'cache',
      task: 'useFetch',
      title: 'Bonus: Antworten werden pro URL gecacht',
      optional: true,
      run: async (ctx) => {
        const url = 'https://example.test/cached'
        const fetchMock = mockFetch(ctx, () => jsonResponse(ctx, PAYLOAD))
        try {
          for (let i = 0; i < 2; i++) {
            const probe = mountProbe(ctx, url, {})
            await ctx.waitFor(() => probe.results.some((r) => statusOf(r) === 'success'), 2000)
            probe.unmount()
          }
          return fetchMock.calls.length === 1
            ? pass()
            : fail(`Für dieselbe URL wurde fetch ${fetchMock.calls.length}× aufgerufen.`)
        } finally {
          fetchMock.restore()
        }
      },
    },
    { ...weatherChecks.request, task: 'Wetter-App' },
    { ...weatherChecks.temperature, task: 'Wetter-App' },
    { ...weatherChecks.description, task: 'Wetter-App' },
    {
      id: 'uses-hook',
      task: 'Wetter-App',
      title: 'Die App lädt die Wetterdaten mit useFetch',
      run: ({ files }) =>
        /useFetch\s*(<[^>]*>)?\s*\(/.test(files['App.tsx'] ?? '')
          ? pass()
          : fail('Nutze deinen useFetch-Hook in App.tsx für die Wetter-Anfrage.'),
    },
  ],
}

export const reactChallenges = [makeItCount, reactiveWeather]
