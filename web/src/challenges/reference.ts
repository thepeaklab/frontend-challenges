import type { Files } from './types'

// Reference solutions live in web/reference/<challenge id>/.
const PREFIX = '../../reference/'
const modules = import.meta.glob<string>('../../reference/**/*', { query: '?raw', import: 'default', eager: true })

export function reference(id: string): Files | undefined {
  const prefix = `${PREFIX}${id}/`
  const entries = Object.entries(modules)
    .filter(([path]) => path.startsWith(prefix))
    .map(([path, content]) => [path.slice(prefix.length), content] as const)
  return entries.length ? Object.fromEntries(entries) : undefined
}
