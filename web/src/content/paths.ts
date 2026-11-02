/** Joins a relative path onto a directory, resolving `.` and `..` segments. */
export function resolvePath(dir: string, relative: string): string {
  const base = relative.startsWith('/') ? [] : dir.split('/').filter(Boolean)
  for (const part of relative.split('/')) {
    if (part === '' || part === '.') continue
    if (part === '..') base.pop()
    else base.push(part)
  }
  return base.join('/')
}

export function dirname(path: string): string {
  const index = path.lastIndexOf('/')
  return index === -1 ? '' : path.slice(0, index)
}

export function extname(path: string): string {
  const match = /\.([^./]+)$/.exec(path)
  return match ? match[1].toLowerCase() : ''
}

/** True for URLs that point outside of the challenge files (http, data, mailto, anchors, ...). */
export function isExternalUrl(url: string): boolean {
  return /^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(url.trim())
}

/** Strips query string and hash from a URL. */
export function stripQuery(url: string): string {
  return url.split(/[?#]/)[0]
}
