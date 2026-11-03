import { describe, expect, it } from 'vitest'
import { dirname, extname, isExternalUrl, resolvePath } from './paths'

describe('resolvePath', () => {
  it('joins and normalizes relative paths', () => {
    expect(resolvePath('html_css/02_basics', 'assets/logo.png')).toBe('html_css/02_basics/assets/logo.png')
    expect(resolvePath('html_css/02_basics', './index.html')).toBe('html_css/02_basics/index.html')
    expect(resolvePath('react/02_reactive_weather', '../../js/02_weather/')).toBe('js/02_weather')
  })

  it('treats absolute paths as relative to the root', () => {
    expect(resolvePath('css/components', '/img/a.png')).toBe('img/a.png')
  })
})

describe('path helpers', () => {
  it('extracts dirname and extension', () => {
    expect(dirname('css/components/btn.css')).toBe('css/components')
    expect(dirname('index.html')).toBe('')
    expect(extname('App.TSX')).toBe('tsx')
  })

  it('detects external urls', () => {
    expect(isExternalUrl('https://fonts.googleapis.com/css')).toBe(true)
    expect(isExternalUrl('//cdn.example.com/x.js')).toBe(true)
    expect(isExternalUrl('data:image/png;base64,abc')).toBe(true)
    expect(isExternalUrl('#top')).toBe(true)
    expect(isExternalUrl('css/styles.css')).toBe(false)
  })
})
