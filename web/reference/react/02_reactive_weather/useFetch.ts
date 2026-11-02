import { useEffect, useState } from 'react'

export type FetchStatus = 'loading' | 'success' | 'error'

export interface FetchState<T> {
  data?: T
  error?: Error
  status: FetchStatus
}

// Responses are cached per url for the lifetime of the page.
const cache = new Map<string, unknown>()

export function useFetch<T = unknown>(url: string, options?: RequestInit): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>(() =>
    cache.has(url) ? { data: cache.get(url) as T, status: 'success' } : { status: 'loading' },
  )

  useEffect(() => {
    if (cache.has(url)) {
      setState({ data: cache.get(url) as T, status: 'success' })
      return
    }

    // Ignore results that arrive after the component unmounted or the url changed.
    let active = true
    const controller = new AbortController()
    setState({ status: 'loading' })

    fetch(url, { ...options, signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Request failed with status ${response.status}`)
        return response.json() as Promise<T>
      })
      .then((data) => {
        cache.set(url, data)
        if (active) setState({ data, status: 'success' })
      })
      .catch((error: Error) => {
        if (active) setState({ error, status: 'error' })
      })

    return () => {
      active = false
      controller.abort()
    }
    // options are intentionally not a dependency: callers usually pass a new object on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url])

  return state
}
