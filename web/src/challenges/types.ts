export type Files = Record<string, string>

export type Category = 'html_css' | 'js' | 'react'

/**
 * - `web`: plain HTML/CSS/JS, rendered from `entry` (an HTML file)
 * - `react`: TS/TSX modules transpiled in the browser, `entry` is the module rendering the app
 * - `external`: the challenge happens outside of this app (only the description is shown)
 */
export type ChallengeKind = 'web' | 'react' | 'external'

export interface CheckOutcome {
  pass: boolean
  message?: string
}

export interface FcBridge {
  fetchCalls: { url: string; init?: RequestInit }[]
  geoCalls: number
  errors: unknown[]
  logs: { level: string; args: unknown[] }[]
  require: (path: string) => Record<string, unknown>
}

export type FrameWindow = Window & typeof globalThis & { __fc: FcBridge; __fcModules?: Record<string, any> }

export interface CheckContext {
  win: FrameWindow
  doc: Document
  /** The learner's files as they are in the editor. */
  files: Files
  wait: (ms: number) => Promise<void>
  /** Polls `fn` until it returns a truthy value or the timeout is reached. */
  waitFor: <T>(fn: () => T, timeout?: number) => Promise<T | undefined>
}

export interface Check {
  id: string
  /** Groups checks, e.g. "Challenge 1". */
  task?: string
  title: string
  /** Optional checks are hints/bonus and don't block passing the challenge. */
  optional?: boolean
  run: (ctx: CheckContext) => boolean | CheckOutcome | Promise<boolean | CheckOutcome>
}

export interface Challenge {
  id: string
  category: Category
  slug: string
  number: number
  title: string
  summary: string
  topics: string[]
  kind: ChallengeKind
  /** Directory of the challenge in the repository. */
  dir: string
  files?: Files
  entry?: string
  readOnly?: string[]
  /** Reference solution; shown on request. */
  reference?: Files
  externalUrl?: string
  checks?: Check[]
  /** Script injected into the test frame before learner code (mocks for fetch, geolocation, ...). */
  testBootstrap?: string
  /** Extra time the test frame needs to settle before checks run (e.g. Tailwind CDN). */
  settleMs?: number
  /** Repo directories whose images may be referenced from this challenge (besides `dir`). */
  assetDirs?: string[]
}

export interface CheckResult {
  id: string
  task?: string
  title: string
  optional?: boolean
  pass: boolean
  message?: string
}
