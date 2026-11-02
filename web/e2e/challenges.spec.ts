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

async function failedChecks(page: Page): Promise<string[]> {
  return page.locator('.check.fail:not(.optional)').allInnerTexts()
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
