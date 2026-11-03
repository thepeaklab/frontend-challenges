// Bundled into public/runtime/react-runtime.js and loaded inside the preview iframe.
// Exposes the modules that learner code may `import` from.
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import * as ReactDOMClient from 'react-dom/client'
import * as JsxRuntime from 'react/jsx-runtime'

const asModule = (ns: object, fallbackDefault: object = ns) => ({
  ...ns,
  default: 'default' in ns ? (ns as { default: unknown }).default : fallbackDefault,
  __esModule: true,
})

;(window as unknown as { __fcModules: Record<string, unknown> }).__fcModules = {
  react: asModule(React),
  'react-dom': asModule(ReactDOM),
  'react-dom/client': asModule(ReactDOMClient),
  'react/jsx-runtime': asModule(JsxRuntime),
  'react/jsx-dev-runtime': asModule(JsxRuntime),
}
