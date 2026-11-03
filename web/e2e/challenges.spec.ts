import { expect, test, type Page } from '@playwright/test'

const CHALLENGES = [
  { path: 'html_css/01_hello-world', reference: true },
  { path: 'html_css/02_basics', reference: true },
  { path: 'html_css/03_newspaper', reference: false },
  { path: 'html_css/04_css-animations', reference: true },
  { path: 'html_css/05_tailwind', reference: true },
  { path: 'js/01_tax-calculator', reference: true },
  { path: 'js/02_weather', reference: true },
  { path: 'react/01_make_it_count', reference: true },
  { path: 'react/02_reactive_weather', reference: true },
]

async function runChecks(page: Page) {
  await page.getByRole('button', { name: '▶ Prüfen' }).click()
  await expect(page.locator('.checks-summary')).toBeVisible({ timeout: 30_000 })
  await expect(page.getByRole('button', { name: '▶ Prüfen' })).toBeEnabled({ timeout: 30_000 })
}

// Optional tasks that are up to the learner's own creativity, so no reference solves them.
const FREE_TASKS = ['Dein eigener Button']

/** Failed checks, optional ones included: a reference should not leave hints open. */
async function failedChecks(page: Page): Promise<string[]> {
  const failed = await page.locator('.check.fail').allInnerTexts()
  return failed.filter((text) => !FREE_TASKS.some((task) => text.includes(task)))
}

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
})

test('home lists all challenges', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.card')).toHaveCount(10)
})

for (const { path, reference } of CHALLENGES) {
  test.describe(path, () => {
    test('starter code does not pass yet', async ({ page }) => {
      await page.goto(`/#/challenge/${path}`)
      await expect(page.locator('.markdown h1')).toBeVisible()
      await runChecks(page)
      await expect(page.locator('.checks-summary')).not.toHaveClass(/success/)
      // Behaviour checks must not pass by accident when no code has been written yet.
      if (path === 'js/01_tax-calculator') await expect(page.locator('.check.pass')).toHaveCount(0)
    })

    if (reference) {
      test('reference solution passes all checks', async ({ page }) => {
        await page.goto(`/#/challenge/${path}`)
        await page.getByRole('tab', { name: 'Ziel' }).click()
        await page.getByRole('button', { name: 'In den Editor laden' }).click()
        await page.getByRole('button', { name: 'Deinen Code überschreiben?' }).click()
        await runChecks(page)
        expect(await failedChecks(page)).toEqual([])
        await expect(page.locator('.checks-summary')).toHaveClass(/success/)

        // The progress is stored and shown on the overview.
        await page.goto('/')
        await expect(page.locator(`a[href="#/challenge/${path}"] .badge.passed`)).toBeVisible()
      })
    }
  })
}

test('preview renders learner code and forwards console output', async ({ page }) => {
  await page.goto('/#/challenge/html_css/01_hello-world')
  await page.locator('.cm-content').click()
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.insertText('<html><body><h1>Hallo Test</h1><script>console.log("log aus der Vorschau")</script></body></html>')
  const preview = page.frameLocator('iframe[title="Vorschau deiner Lösung"]')
  await expect(preview.locator('h1')).toHaveText('Hallo Test')
  await page.getByRole('tab', { name: /Konsole/ }).click()
  await expect(page.locator('.console-entry')).toContainText('log aus der Vorschau')
})

test('readme images resolve', async ({ page }) => {
  await page.goto('/#/challenge/html_css/02_basics')
  const image = page.locator('.markdown img').first()
  await expect(image).toBeVisible()
  expect(await image.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0)
})

test('external challenge links to the course', async ({ page }) => {
  await page.goto('/#/challenge/js/03_typescript')
  await expect(page.getByRole('link', { name: /Zum Kurs-Repository/ })).toHaveAttribute('href', /total-typescript/)
})

test('viewport switcher emulates device widths for media queries', async ({ page }) => {
  await page.goto('/#/challenge/html_css/02_basics')
  await page.getByRole('tab', { name: 'Ziel' }).click()
  await page.getByRole('button', { name: 'In den Editor laden' }).click()
  await page.getByRole('button', { name: 'Deinen Code überschreiben?' }).click()
  await page.getByRole('tab', { name: 'Vorschau' }).click()

  const frameElement = page.locator('iframe[title="Vorschau deiner Lösung"]')
  const layout = async () => {
    const frame = await (await frameElement.elementHandle())!.contentFrame()
    return frame!.evaluate(() => {
      // Header and content sit below each other on mobile and side by side from 768px on.
      const wrapper = document.querySelector('header')?.parentElement
      return { width: window.innerWidth, header: wrapper && getComputedStyle(wrapper).flexDirection }
    })
  }
  const viewports = page.getByRole('group', { name: 'Viewport' })

  await viewports.getByRole('button', { name: 'Mobil' }).click()
  await expect.poll(layout).toEqual({ width: 390, header: 'column' })

  await viewports.getByRole('button', { name: 'Tablet' }).click()
  await expect.poll(layout).toEqual({ width: 768, header: 'row' })

  await viewports.getByRole('button', { name: 'Desktop' }).click()
  await expect.poll(layout).toEqual({ width: 1280, header: 'row' })

  // The choice is remembered and the device is scaled down to fit the pane.
  await viewports.getByRole('button', { name: 'Mobil' }).click()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Mobil' })).toHaveAttribute('aria-pressed', 'true')
  await expect.poll(layout).toEqual({ width: 390, header: 'column' })
  const box = await frameElement.boundingBox()
  expect(box!.width).toBeLessThan(390)
})
