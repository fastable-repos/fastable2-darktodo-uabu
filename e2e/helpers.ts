import { Page } from '@playwright/test'
import path from 'path'
import fs from 'fs'

const SCREENSHOT_DIR = path.resolve(process.cwd(), 'e2e', 'screenshots')

export async function captureScreenshot(page: Page, name: string): Promise<void> {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
  }
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, `${name}.png`),
    fullPage: true,
  })
}

export async function assertNoConsoleErrors(page: Page): Promise<void> {
  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })
  await page.waitForTimeout(100)
  if (errors.length > 0) {
    throw new Error(`Console errors detected:\n${errors.join('\n')}`)
  }
}
