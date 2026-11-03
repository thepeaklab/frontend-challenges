import { fail, pass, typeInto } from '../checks/helpers'
import {
  FIXTURE_DESCRIPTION,
  FIXTURE_TEMPERATURE,
  MOCK_POSITION,
  WEATHER_TEST_BOOTSTRAP,
} from '../checks/weather-fixture'
import { repoFiles } from '../content/repo'
import { reference } from './reference'
import type { Challenge, CheckContext, CheckOutcome } from './types'

/** Normalizes a displayed amount: "1.234,50 €" → "1234,50". */
function normalizeAmount(value: string): string {
  const compact = value.replace(/[€\s ]/g, '')
  return compact.includes(',') ? compact.replace(/\./g, '') : compact
}

async function expectConversion(
  ctx: CheckContext,
  input: 'net' | 'tax' | 'gross',
  value: string,
  expected: Record<'net' | 'tax' | 'gross', string>,
): Promise<CheckOutcome> {
  const field = (name: string) => ctx.doc.getElementById(`${name}-field`) as HTMLInputElement | null
  const source = field(input)
  if (!source) return fail(`Das Feld #${input}-field fehlt – das Markup sollte unverändert bleiben.`)
  // Clear values left over from earlier checks, so only freshly calculated results count.
  for (const name of ['net', 'tax', 'gross']) {
    const other = field(name)
    if (other && name !== input) other.value = ''
  }
  typeInto(ctx.win, source, value)
  await ctx.wait(60)

  const wrong = (['net', 'tax', 'gross'] as const)
    .filter((name) => name !== input)
    .map((name) => ({ name, actual: field(name)?.value ?? '', expected: expected[name] }))
    .filter(({ actual, expected }) => normalizeAmount(actual) !== expected)

  if (wrong.length === 0) return pass()
  return fail(
    `Eingabe „${value}“ in #${input}-field: ` +
      wrong.map(({ name, actual, expected }) => `#${name}-field zeigt „${actual}“, erwartet „${expected}“`).join('; '),
  )
}

function hasErrorFeedback(ctx: CheckContext, input: HTMLInputElement): boolean {
  return (
    Array.from(input.classList).some((name) => /invalid|error|fehler/i.test(name)) ||
    input.getAttribute('aria-invalid') === 'true' ||
    input.matches(':invalid') ||
    Array.from(input.closest('label')?.classList ?? []).some((name) => /invalid|error|fehler/i.test(name)) ||
    ctx.win.getComputedStyle(input).backgroundColor === 'rgba(255, 0, 0, 0.25)'
  )
}

const taxCalculator: Challenge = {
  id: 'js/01_tax-calculator',
  category: 'js',
  slug: '01_tax-calculator',
  number: 1,
  title: 'Tax Calculator',
  summary: 'Ein Umsatzsteuer-Rechner: DOM-Zugriff, Events und Validierung.',
  topics: ['DOM', 'Events', 'Validierung'],
  kind: 'web',
  dir: 'js/01_tax-calculator',
  entry: 'index.html',
  files: repoFiles('js/01_tax-calculator'),
  reference: reference('js/01_tax-calculator'),
  checks: [
    {
      id: 'script',
      title: 'main.js wird in der index.html geladen',
      run: ({ doc }) =>
        doc.querySelector('script[data-fc-file="js/main.js"]')
          ? pass()
          : fail('Binde dein Script ein: <script src="js/main.js"></script> (am Ende des <body> oder mit defer).'),
    },
    {
      id: 'from-net',
      title: 'Netto → Umsatzsteuer und Brutto',
      run: (ctx) => expectConversion(ctx, 'net', '100,00', { net: '100,00', tax: '19,00', gross: '119,00' }),
    },
    {
      id: 'from-gross',
      title: 'Brutto → Netto und Umsatzsteuer',
      run: (ctx) => expectConversion(ctx, 'gross', '119,00', { net: '100,00', tax: '19,00', gross: '119,00' }),
    },
    {
      id: 'from-tax',
      title: 'Umsatzsteuer → Netto und Brutto',
      run: (ctx) => expectConversion(ctx, 'tax', '19,00', { net: '100,00', tax: '19,00', gross: '119,00' }),
    },
    {
      id: 'rounding',
      title: 'Ergebnisse werden auf zwei Nachkommastellen gerundet',
      run: (ctx) => expectConversion(ctx, 'net', '33,33', { net: '33,33', tax: '6,33', gross: '39,66' }),
    },
    {
      id: 'large-numbers',
      title: 'Beliebig lange Zahlen',
      run: (ctx) =>
        expectConversion(ctx, 'net', '1234567,89', { net: '1234567,89', tax: '234567,90', gross: '1469135,79' }),
    },
    {
      id: 'invalid',
      title: 'Visuelles Feedback bei ungültiger Eingabe',
      run: async (ctx) => {
        const input = ctx.doc.getElementById('net-field') as HTMLInputElement | null
        if (!input) return fail('Das Feld #net-field fehlt.')
        typeInto(ctx.win, input, '12a')
        await ctx.wait(60)
        return hasErrorFeedback(ctx, input)
          ? pass()
          : fail('Bei „12a“ bekommt das Feld kein Feedback. Tipp: die Klasse .invalid ist im CSS schon vorbereitet.')
      },
    },
    {
      id: 'invalid-reset',
      title: 'Das Feedback verschwindet bei gültiger Eingabe',
      run: async (ctx) => {
        const input = ctx.doc.getElementById('net-field') as HTMLInputElement | null
        if (!input) return fail('Das Feld #net-field fehlt.')
        typeInto(ctx.win, input, '12a')
        await ctx.wait(60)
        if (!hasErrorFeedback(ctx, input)) return fail('Bei „12a“ erscheint noch kein Feedback, das wieder verschwinden könnte.')
        typeInto(ctx.win, input, '12,00')
        await ctx.wait(60)
        return hasErrorFeedback(ctx, input) ? fail('Nach der Korrektur auf „12,00“ ist das Feld noch als fehlerhaft markiert.') : pass()
      },
    },
  ],
}

const WEATHER_STARTER = {
  'index.html': `<!DOCTYPE html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Wetter</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <main id="app">Lade Wetter…</main>
    <script src="main.js"></script>
  </body>
</html>
`,
  'style.css': `body {
  font-family: system-ui, sans-serif;
}
`,
  'main.js': `// 1. Position mit navigator.geolocation ermitteln
// 2. Wetterdaten bei https://api.open-meteo.com abfragen
// 3. Temperatur und Wetterlage anzeigen
`,
}

export const weatherChecks = {
  geolocation: {
    id: 'geolocation',
    title: 'Die aktuelle Position wird abgefragt',
    run: async ({ win, waitFor }: CheckContext) =>
      (await waitFor(() => win.__fc.geoCalls > 0, 2000))
        ? pass()
        : fail('Nutze navigator.geolocation.getCurrentPosition(…), um die Position zu ermitteln.'),
  },
  request: {
    id: 'request',
    title: 'Anfrage an die Open-Meteo API mit der Position',
    run: async ({ win, waitFor }: CheckContext) => {
      const call = await waitFor(() => win.__fc.fetchCalls.find((c) => /api\.open-meteo\.com/.test(c.url)), 3000)
      if (!call) return fail('Es wurde keine Anfrage an https://api.open-meteo.com gesendet (fetch).')
      const url = new URL(call.url, 'https://api.open-meteo.com')
      const lat = Number(url.searchParams.get('latitude'))
      const lon = Number(url.searchParams.get('longitude'))
      return Math.abs(lat - MOCK_POSITION.latitude) < 0.01 && Math.abs(lon - MOCK_POSITION.longitude) < 0.01
        ? pass()
        : fail(`Die Anfrage nutzt latitude=${lat}, longitude=${lon} statt der ermittelten Position.`)
    },
  },
  temperature: {
    id: 'temperature',
    title: 'Die Temperatur wird angezeigt',
    run: async ({ doc, waitFor }: CheckContext) =>
      (await waitFor(() => FIXTURE_TEMPERATURE.test(doc.body.textContent ?? ''), 3000))
        ? pass()
        : fail('Im Test liefert die API 17,3 °C – diese Temperatur (mit °) sollte auf der Seite erscheinen.'),
  },
  description: {
    id: 'description',
    title: 'Die Wetterlage wird beschrieben',
    run: async ({ doc, waitFor }: CheckContext) =>
      (await waitFor(() => FIXTURE_DESCRIPTION.test(doc.body.textContent ?? ''), 3000))
        ? pass()
        : fail('Im Test liefert die API den weathercode 3 (bedeckt) – übersetze den Code in eine Beschreibung.'),
  },
}

const weather: Challenge = {
  id: 'js/02_weather',
  category: 'js',
  slug: '02_weather',
  number: 2,
  title: 'Weather',
  summary: 'Eine Wetter-App mit Geolocation und der Open-Meteo API – ganz ohne Libraries.',
  topics: ['fetch', 'APIs', 'Geolocation'],
  kind: 'web',
  dir: 'js/02_weather',
  entry: 'index.html',
  files: WEATHER_STARTER,
  reference: reference('js/02_weather'),
  testBootstrap: WEATHER_TEST_BOOTSTRAP,
  checks: [
    {
      id: 'vanilla',
      title: 'Keine Libraries oder Frameworks',
      run: ({ doc }) => {
        const external = Array.from(doc.querySelectorAll('script[src]')).map((s) => s.getAttribute('src'))
        return external.length === 0 ? pass() : fail(`Externe Scripts gefunden: ${external.join(', ')}`)
      },
    },
    weatherChecks.geolocation,
    weatherChecks.request,
    weatherChecks.temperature,
    weatherChecks.description,
  ],
}

const typescript: Challenge = {
  id: 'js/03_typescript',
  category: 'js',
  slug: '03_typescript',
  number: 3,
  title: 'TypeScript',
  summary: 'Der Kurs „Beginner’s TypeScript“ von Matt Pocock – 18 kleine Übungen.',
  topics: ['TypeScript', 'Typen'],
  kind: 'external',
  dir: 'js/03_typescript',
  externalUrl: 'https://github.com/total-typescript/beginners-typescript-tutorial',
}

export const jsChallenges = [taxCalculator, weather, typescript]
