import type { CheckContext, CheckOutcome, FrameWindow } from '../challenges/types'

export const pass = (message?: string): CheckOutcome => ({ pass: true, message })
export const fail = (message: string): CheckOutcome => ({ pass: false, message })

/** All CSS rules of the document, including rules nested in @import, @media, @supports and @layer. */
export function allRules(doc: Document): CSSRule[] {
  const out: CSSRule[] = []
  const walk = (rules: CSSRuleList | undefined) => {
    if (!rules) return
    for (const rule of Array.from(rules)) {
      out.push(rule)
      if ('styleSheet' in rule && (rule as CSSImportRule).styleSheet) {
        walk(safeRules((rule as CSSImportRule).styleSheet!))
      }
      if ('cssRules' in rule) walk((rule as CSSGroupingRule).cssRules)
    }
  }
  for (const sheet of Array.from(doc.styleSheets)) walk(safeRules(sheet))
  return out
}

function safeRules(sheet: CSSStyleSheet): CSSRuleList | undefined {
  try {
    return sheet.cssRules
  } catch {
    return undefined // cross-origin stylesheet (e.g. Google Fonts)
  }
}

/** Style rules whose selector matches `selector`. */
export function styleRules(doc: Document, selector: RegExp): CSSStyleRule[] {
  return allRules(doc).filter(
    (rule): rule is CSSStyleRule => 'selectorText' in rule && selector.test((rule as CSSStyleRule).selectorText),
  )
}

export function mediaRules(doc: Document): CSSMediaRule[] {
  return allRules(doc).filter((rule): rule is CSSMediaRule => rule.constructor.name === 'CSSMediaRule')
}

export function keyframesRules(doc: Document): CSSKeyframesRule[] {
  return allRules(doc).filter((rule): rule is CSSKeyframesRule => rule.constructor.name === 'CSSKeyframesRule')
}

export function computed(ctx: CheckContext, el: Element, pseudo?: string): CSSStyleDeclaration {
  return ctx.win.getComputedStyle(el, pseudo)
}

/** Simulates a user typing a value into an input. */
export function typeInto(win: FrameWindow, input: HTMLInputElement, value: string): void {
  input.focus()
  input.dispatchEvent(new win.KeyboardEvent('keydown', { bubbles: true, key: value.slice(-1) }))
  input.value = value
  input.dispatchEvent(new win.InputEvent('input', { bubbles: true, data: value, inputType: 'insertText' }))
  input.dispatchEvent(new win.KeyboardEvent('keyup', { bubbles: true, key: value.slice(-1) }))
  input.dispatchEvent(new win.Event('change', { bubbles: true }))
}

export function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`
}

/** Compares a check list ("x von y") and builds a consistent message. */
export function atLeast(count: number, required: number, label: string): CheckOutcome {
  return count >= required
    ? pass(`${count} gefunden.`)
    : fail(`Es sind ${count} ${label} vorhanden – mindestens ${required} werden benötigt.`)
}
