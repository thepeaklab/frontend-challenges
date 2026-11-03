import { transform } from 'sucrase'
import type { Challenge, Files } from '../challenges/types'
import { assetUrl } from '../content/repo'
import { dirname, extname, isExternalUrl, resolvePath, stripQuery } from '../content/paths'
import { BOOTSTRAP_SCRIPT } from './bootstrap'

export type BuildMode = 'preview' | 'test'

export interface BuildOptions {
  challenge: Challenge
  files: Files
  mode: BuildMode
  /** Absolute URL of the bundled React runtime (react challenges only). */
  runtimeUrl?: string
}

/** Prevents learner code from closing the surrounding inline <script>. */
function escapeScript(code: string): string {
  return code.replace(/<\/script/gi, '<\\/script')
}

function bootstrapTags(challenge: Challenge, mode: BuildMode): string {
  const scripts = [BOOTSTRAP_SCRIPT]
  if (mode === 'test' && challenge.testBootstrap) scripts.push(challenge.testBootstrap)
  return scripts.map((code) => `<script data-fc>${escapeScript(code)}</script>`).join('\n')
}

/** Resolves a path used in learner code to a bundled image URL. */
function resolveAsset(challenge: Challenge, fileDir: string, url: string): string | undefined {
  const relative = resolvePath(fileDir, stripQuery(url))
  for (const dir of [challenge.dir, ...(challenge.assetDirs ?? [])]) {
    const found = assetUrl(`${dir}/${relative}`)
    if (found) return found
  }
  return undefined
}

function rewriteCssUrls(css: string, challenge: Challenge, fileDir: string): string {
  return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (match, quote: string, url: string) => {
    if (isExternalUrl(url)) return match
    const resolved = resolveAsset(challenge, fileDir, url)
    return resolved ? `url(${quote}${resolved}${quote})` : match
  })
}

/** Inlines local `@import`s (recursively) and rewrites asset urls. */
export function flattenCss(
  path: string,
  files: Files,
  challenge: Challenge,
  warnings: string[],
  seen = new Set<string>(),
): string {
  if (seen.has(path)) return `/* zyklischer @import: ${path} */`
  seen.add(path)
  const css = files[path]
  if (css === undefined) {
    warnings.push(`CSS-Datei nicht gefunden: ${path}`)
    return ''
  }
  return inlineCss(css, dirname(path), files, challenge, warnings, seen)
}

function inlineCss(
  css: string,
  dir: string,
  files: Files,
  challenge: Challenge,
  warnings: string[],
  seen: Set<string>,
): string {
  const withImports = css.replace(
    /@import\s+(?:url\(\s*)?(['"]?)([^'")\s;]+)\1\s*\)?\s*([^;]*);/g,
    (match, _quote: string, url: string, media: string) => {
      if (isExternalUrl(url)) return match
      const inner = flattenCss(resolvePath(dir, url), files, challenge, warnings, seen)
      return media.trim() ? `@media ${media.trim()} {\n${inner}\n}` : inner
    },
  )
  return rewriteCssUrls(withImports, challenge, dir)
}

function buildWebDocument({ challenge, files, mode }: BuildOptions): string {
  const entry = challenge.entry ?? 'index.html'
  const entryDir = dirname(entry)
  const warnings: string[] = []
  const doc = new DOMParser().parseFromString(files[entry] ?? '', 'text/html')

  // Local stylesheets are inlined as <style> elements so the srcdoc frame needs no server.
  for (const link of Array.from(doc.querySelectorAll<HTMLLinkElement>('link[rel~="stylesheet"][href]'))) {
    const href = link.getAttribute('href')!
    if (isExternalUrl(href)) continue
    const path = resolvePath(entryDir, stripQuery(href))
    const style = doc.createElement('style')
    style.setAttribute('data-fc-file', path)
    if (link.media) style.media = link.media
    style.textContent = flattenCss(path, files, challenge, warnings)
    link.replaceWith(style)
  }

  for (const style of Array.from(doc.querySelectorAll('style:not([data-fc-file])'))) {
    style.textContent = inlineCss(style.textContent ?? '', entryDir, files, challenge, warnings, new Set())
  }

  for (const script of Array.from(doc.querySelectorAll<HTMLScriptElement>('script[src]'))) {
    const src = script.getAttribute('src')!
    if (isExternalUrl(src)) continue
    const path = resolvePath(entryDir, stripQuery(src))
    if (files[path] === undefined) {
      warnings.push(`Script nicht gefunden: ${src}`)
      continue
    }
    const inline = doc.createElement('script')
    for (const attr of Array.from(script.attributes)) {
      if (attr.name !== 'src') inline.setAttribute(attr.name, attr.value)
    }
    inline.setAttribute('data-fc-file', path)
    inline.textContent = escapeScript(files[path])
    script.replaceWith(inline)
  }

  for (const element of Array.from(doc.querySelectorAll('[src], link[rel~="icon"][href], video[poster]'))) {
    for (const attr of ['src', 'href', 'poster']) {
      const value = element.getAttribute(attr)
      if (!value || isExternalUrl(value) || element.tagName === 'SCRIPT') continue
      const resolved = resolveAsset(challenge, entryDir, value)
      if (resolved) element.setAttribute(attr, resolved)
    }
  }

  for (const element of Array.from(doc.querySelectorAll('[style]'))) {
    element.setAttribute('style', rewriteCssUrls(element.getAttribute('style')!, challenge, entryDir))
  }

  const warningScript = warnings.length
    ? `<script data-fc>${warnings.map((w) => `console.warn(${JSON.stringify(w)});`).join('')}</script>`
    : ''
  doc.head.insertAdjacentHTML('afterbegin', bootstrapTags(challenge, mode) + warningScript)

  return (doc.doctype ? '<!DOCTYPE html>\n' : '') + doc.documentElement.outerHTML
}

const MODULE_EXTENSIONS = ['ts', 'tsx', 'js', 'jsx']

export interface TranspileResult {
  modules: Record<string, string>
  styles: Record<string, string>
  errors: string[]
}

/** Transpiles TS/TSX/JSX files to CommonJS function bodies. */
export function transpileModules(files: Files): TranspileResult {
  const result: TranspileResult = { modules: {}, styles: {}, errors: [] }
  for (const [path, code] of Object.entries(files)) {
    const ext = extname(path)
    if (ext === 'css') {
      result.styles[path] = code
    } else if (MODULE_EXTENSIONS.includes(ext)) {
      try {
        result.modules[path] = transform(code, {
          transforms: ext === 'js' || ext === 'jsx' ? ['jsx', 'imports'] : ['typescript', 'jsx', 'imports'],
          jsxRuntime: 'automatic',
          production: true,
          filePath: path,
        }).code
      } catch (error) {
        result.errors.push(`${path}: ${(error as Error).message}`)
      }
    }
  }
  return result
}

// Minimal CommonJS loader running inside the frame. Bare imports resolve to the
// bundled runtime (`window.__fcModules`), relative imports to the learner's files.
const MODULE_LOADER = `
var cache = {};
var candidates = ['', '.tsx', '.ts', '.jsx', '.js', '.css', '/index.tsx', '/index.ts', '/index.jsx', '/index.js'];
function normalize(path) {
  var out = [];
  path.split('/').forEach(function (part) {
    if (!part || part === '.') return;
    if (part === '..') out.pop(); else out.push(part);
  });
  return out.join('/');
}
function resolve(from, spec) {
  var dir = from.indexOf('/') === -1 ? '' : from.slice(0, from.lastIndexOf('/'));
  var base = normalize(spec.charAt(0) === '/' ? spec : dir + '/' + spec);
  for (var i = 0; i < candidates.length; i++) {
    var path = base + candidates[i];
    if (defs[path] || styles[path] !== undefined) return path;
  }
  return null;
}
function load(path) {
  if (cache[path]) return cache[path].exports;
  var module = (cache[path] = { exports: {} });
  if (styles[path] !== undefined) {
    var style = document.createElement('style');
    style.setAttribute('data-fc-file', path);
    style.textContent = styles[path];
    document.head.appendChild(style);
    return module.exports;
  }
  defs[path](module, module.exports, function (spec) { return requireFrom(path, spec); });
  return module.exports;
}
function requireFrom(from, spec) {
  if (spec.charAt(0) !== '.' && spec.charAt(0) !== '/') {
    var external = window.__fcModules && window.__fcModules[spec];
    if (!external) throw new Error('Das Paket "' + spec + '" ist in dieser Umgebung nicht verfügbar.');
    return external;
  }
  var path = resolve(from, spec);
  if (!path) throw new Error('Datei "' + spec + '" nicht gefunden (importiert in ' + (from || 'Test') + ').');
  return load(path);
}
window.__fc.require = function (spec) { return requireFrom('', spec); };
`

function buildReactDocument({ challenge, files, mode, runtimeUrl }: BuildOptions): string {
  const entry = challenge.entry ?? 'main.tsx'
  const { modules, styles, errors } = transpileModules(files)
  const defs = Object.entries(modules)
    .map(
      ([path, code]) =>
        `${JSON.stringify(path)}: function (module, exports, require) {\n${code}\n}`,
    )
    .join(',\n')

  const run = errors.length
    ? errors.map((e) => `window.__fc.reportError(new SyntaxError(${JSON.stringify(e)}));`).join('\n')
    : `try { requireFrom('', ${JSON.stringify('./' + entry)}); } catch (error) { window.__fc.reportError(error); }`

  const program = `(function () {
var defs = {
${defs}
};
var styles = ${JSON.stringify(styles)};
${MODULE_LOADER}
${run}
})();`

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
${bootstrapTags(challenge, mode)}
<script src="${runtimeUrl ?? ''}"></script>
</head>
<body>
<div id="root"></div>
<script data-fc>${escapeScript(program)}</script>
</body>
</html>`
}

export function buildDocument(options: BuildOptions): string {
  return options.challenge.kind === 'react' ? buildReactDocument(options) : buildWebDocument(options)
}

export function reactRuntimeUrl(): string {
  return new URL(`${import.meta.env.BASE_URL}runtime/react-runtime.js`, window.location.href).href
}
