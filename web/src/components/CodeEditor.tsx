import { css } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import CodeMirror from '@uiw/react-codemirror'
import { useMemo } from 'react'
import { extname } from '../content/paths'
import { useDarkMode } from './useDarkMode'

interface Props {
  path: string
  value: string
  readOnly?: boolean
  onChange: (value: string) => void
}

function languageFor(path: string) {
  switch (extname(path)) {
    case 'html':
      return html()
    case 'css':
      return css()
    case 'ts':
      return javascript({ typescript: true })
    case 'tsx':
      return javascript({ typescript: true, jsx: true })
    case 'jsx':
      return javascript({ jsx: true })
    default:
      return javascript()
  }
}

export function CodeEditor({ path, value, readOnly, onChange }: Props) {
  const dark = useDarkMode()
  const extensions = useMemo(() => [languageFor(path)], [path])
  return (
    <CodeMirror
      className="code-editor"
      value={value}
      height="100%"
      theme={dark ? oneDark : 'light'}
      extensions={extensions}
      readOnly={readOnly}
      editable={!readOnly}
      onChange={onChange}
      basicSetup={{ tabSize: 2 }}
      aria-label={`Editor für ${path}`}
    />
  )
}
