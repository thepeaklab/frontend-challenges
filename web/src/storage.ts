import { useSyncExternalStore } from 'react'
import type { Challenge, Files } from './challenges/types'

// Learner code and progress are stored per browser in localStorage.

const filesKey = (id: string) => `fc:files:${id}`
const PROGRESS_KEY = 'fc:progress'
const PROGRESS_EVENT = 'fc:progress'

function read<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : undefined
  } catch {
    return undefined
  }
}

function write(key: string, value: unknown): void {
  try {
    if (value === undefined) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage unavailable (private mode, quota) – the app keeps working without it
  }
}

/** Starter files overlaid with the learner's saved changes. Read-only files always come from the starter. */
export function loadFiles(challenge: Challenge): Files {
  const starter = challenge.files ?? {}
  const saved = read<Files>(filesKey(challenge.id)) ?? {}
  const files = { ...starter, ...saved }
  for (const path of challenge.readOnly ?? []) files[path] = starter[path]
  return files
}

export function saveFiles(challenge: Challenge, files: Files): void {
  write(filesKey(challenge.id), files)
}

export function clearFiles(challenge: Challenge): void {
  write(filesKey(challenge.id), undefined)
}

export interface Progress {
  status: 'started' | 'passed'
  passed?: number
  total?: number
  updatedAt: number
}

type ProgressMap = Record<string, Progress>

let progressCache: ProgressMap | undefined

function getProgress(): ProgressMap {
  progressCache ??= read<ProgressMap>(PROGRESS_KEY) ?? {}
  return progressCache
}

export function updateProgress(id: string, update: Omit<Progress, 'updatedAt'>): void {
  const current = getProgress()[id]
  // Once passed, a challenge stays passed – later failing runs only update the counts.
  const status = current?.status === 'passed' ? 'passed' : update.status
  progressCache = { ...getProgress(), [id]: { ...current, ...update, status, updatedAt: Date.now() } }
  write(PROGRESS_KEY, progressCache)
  window.dispatchEvent(new Event(PROGRESS_EVENT))
}

export function resetProgress(id: string): void {
  const { [id]: _removed, ...rest } = getProgress()
  progressCache = rest
  write(PROGRESS_KEY, progressCache)
  window.dispatchEvent(new Event(PROGRESS_EVENT))
}

function subscribe(callback: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== PROGRESS_KEY) return
    progressCache = undefined
    callback()
  }
  window.addEventListener(PROGRESS_EVENT, callback)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(PROGRESS_EVENT, callback)
    window.removeEventListener('storage', onStorage)
  }
}

export function useProgress(): ProgressMap {
  return useSyncExternalStore(subscribe, getProgress)
}
