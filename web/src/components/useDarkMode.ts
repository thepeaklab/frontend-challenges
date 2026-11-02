import { useSyncExternalStore } from 'react'

const query = () => window.matchMedia('(prefers-color-scheme: dark)')

function subscribe(callback: () => void) {
  const media = query()
  media.addEventListener('change', callback)
  return () => media.removeEventListener('change', callback)
}

export function useDarkMode(): boolean {
  return useSyncExternalStore(subscribe, () => query().matches)
}
