import { useEffect, useRef } from 'react'

export interface ConsoleEntry {
  level: string
  text: string
}

interface Props {
  srcDoc: string
  title: string
  onConsole?: (entry: ConsoleEntry) => void
}

/** Renders a document in a sandboxed iframe and forwards its console output. */
export function PreviewFrame({ srcDoc, title, onConsole }: Props) {
  const frame = useRef<HTMLIFrameElement>(null)
  const onConsoleRef = useRef(onConsole)
  onConsoleRef.current = onConsole

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || event.data?.__fc !== 'console') return
      onConsoleRef.current?.({ level: event.data.level, text: event.data.text })
    }
    window.addEventListener('message', listener)
    return () => window.removeEventListener('message', listener)
  }, [])

  return (
    <iframe
      ref={frame}
      className="preview-frame"
      title={title}
      srcDoc={srcDoc}
      sandbox="allow-scripts allow-same-origin allow-modals allow-popups"
      allow="geolocation"
    />
  )
}
