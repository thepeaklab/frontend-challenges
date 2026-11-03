// Access to the challenge content that lives in the repository root
// (html_css/, js/, react/). Everything is bundled at build time.

const ROOT_PREFIX = '../../../'

function stripRoot<T>(modules: Record<string, T>): Record<string, T> {
  return Object.fromEntries(Object.entries(modules).map(([key, value]) => [key.slice(ROOT_PREFIX.length), value]))
}

const readmes = stripRoot(
  import.meta.glob<string>('../../../{html_css,js,react}/*/README.md', { query: '?raw', import: 'default', eager: true }),
)

const assets = stripRoot(
  import.meta.glob<string>('../../../{html_css,js,react}/**/*.{png,gif,webp,jpg,jpeg,svg}', {
    query: '?url',
    import: 'default',
    eager: true,
  }),
)

const sources = stripRoot(
  import.meta.glob<string>('../../../{html_css,js}/**/*.{html,css,js}', { query: '?raw', import: 'default', eager: true }),
)

export const REPO_URL = 'https://github.com/thepeaklab/frontend-challenges'

export function readme(dir: string): string {
  return readmes[`${dir}/README.md`] ?? ''
}

/** URL of a bundled image from the repo, e.g. `html_css/02_basics/assets/logo.png`. */
export function assetUrl(repoPath: string): string | undefined {
  return assets[repoPath]
}

export function repoFile(repoPath: string): string {
  const content = sources[repoPath]
  if (content === undefined) throw new Error(`Missing repo file: ${repoPath}`)
  return content
}

/** All source files below `dir`, keyed relative to `dir`. */
export function repoFiles(dir: string): Record<string, string> {
  const prefix = `${dir}/`
  return Object.fromEntries(
    Object.entries(sources)
      .filter(([path]) => path.startsWith(prefix))
      .map(([path, content]) => [path.slice(prefix.length), content]),
  )
}

export function githubUrl(repoPath: string): string {
  return `${REPO_URL}/blob/main/${repoPath}`
}
