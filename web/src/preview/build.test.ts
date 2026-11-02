import { describe, expect, it } from 'vitest'
import type { Challenge } from '../challenges/types'
import { buildDocument, flattenCss, transpileModules } from './build'

const webChallenge: Challenge = {
  id: 'html_css/test',
  category: 'html_css',
  slug: 'test',
  number: 1,
  title: 'Test',
  summary: '',
  topics: [],
  kind: 'web',
  dir: 'html_css/02_basics',
  entry: 'index.html',
}

function parse(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html')
}

describe('flattenCss', () => {
  it('inlines local imports recursively and keeps external ones', () => {
    const warnings: string[] = []
    const css = flattenCss(
      'css/styles.css',
      {
        'css/styles.css': "@import url('https://fonts.example/x.css');\n@import url('components/a.css');\nbody { margin: 0; }",
        'css/components/a.css': '@import "b.css";\n.a { color: red; }',
        'css/components/b.css': '.b { color: blue; }',
      },
      webChallenge,
      warnings,
    )
    expect(css).toContain("@import url('https://fonts.example/x.css');")
    expect(css).toContain('.a { color: red; }')
    expect(css).toContain('.b { color: blue; }')
    expect(css).not.toContain('components/a.css')
    expect(warnings).toEqual([])
  })

  it('warns about missing files', () => {
    const warnings: string[] = []
    flattenCss('styles.css', { 'styles.css': '@import "missing.css";' }, webChallenge, warnings)
    expect(warnings).toEqual(['CSS-Datei nicht gefunden: missing.css'])
  })
})

describe('buildDocument (web)', () => {
  const files = {
    'index.html': `<!DOCTYPE html><html><head><link rel="stylesheet" href="css/styles.css"></head>
<body><img src="assets/logo.png"><script src="js/main.js"></script></body></html>`,
    'css/styles.css': 'body { color: red; }',
    'js/main.js': 'console.log("</script>")',
  }

  it('inlines stylesheets and scripts and injects the bootstrap', () => {
    const doc = parse(buildDocument({ challenge: webChallenge, files, mode: 'preview' }))
    expect(doc.querySelector('style[data-fc-file="css/styles.css"]')?.textContent).toBe('body { color: red; }')
    expect(doc.querySelector('script[data-fc-file="js/main.js"]')?.textContent).toContain('<\\/script>')
    expect(doc.querySelector('link[rel="stylesheet"]')).toBeNull()
    expect(doc.head.firstElementChild?.hasAttribute('data-fc')).toBe(true)
  })

  it('resolves images from the challenge directory', () => {
    const doc = parse(buildDocument({ challenge: webChallenge, files, mode: 'preview' }))
    expect(doc.querySelector('img')?.getAttribute('src')).toMatch(/logo.*\.png/)
    expect(doc.querySelector('img')?.getAttribute('src')).not.toBe('assets/logo.png')
  })

  it('keeps a missing doctype missing', () => {
    const html = buildDocument({ challenge: webChallenge, files: { 'index.html': '<html><body>hi</body></html>' }, mode: 'preview' })
    expect(html.startsWith('<!DOCTYPE')).toBe(false)
  })

  it('adds the test bootstrap only in test mode', () => {
    const challenge = { ...webChallenge, testBootstrap: 'window.__testMarker = 1' }
    expect(buildDocument({ challenge, files, mode: 'preview' })).not.toContain('__testMarker')
    expect(buildDocument({ challenge, files, mode: 'test' })).toContain('__testMarker')
  })
})

describe('transpileModules', () => {
  it('turns TSX into CommonJS', () => {
    const { modules, errors } = transpileModules({
      'App.tsx': "import { useState } from 'react'\nexport default function App(): JSX.Element { const [n] = useState<number>(0); return <b>{n}</b> }",
    })
    expect(errors).toEqual([])
    expect(modules['App.tsx']).toContain('require(')
    expect(modules['App.tsx']).not.toContain('<number>')
  })

  it('collects syntax errors per file', () => {
    const { errors } = transpileModules({ 'App.tsx': 'export default function App( {' })
    expect(errors).toHaveLength(1)
    expect(errors[0]).toMatch(/^App\.tsx:/)
  })

  it('keeps css files as styles', () => {
    const { styles } = transpileModules({ 'styles.css': 'body {}' })
    expect(styles).toEqual({ 'styles.css': 'body {}' })
  })
})
