import { test, expect } from '@playwright/test'
import { captureScreenshot } from './helpers'

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function clearStorage(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    localStorage.removeItem('darktodo_items')
    localStorage.removeItem('darktodo_theme')
  })
}

async function addTodo(page: import('@playwright/test').Page, text: string) {
  await page.getByTestId('todo-input').fill(text)
  await page.getByTestId('add-button').click()
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await clearStorage(page)
  await page.reload()
})

// 1. Add a todo
test('happy path - add a todo', async ({ page }) => {
  await page.getByTestId('todo-input').fill('Buy groceries')
  await page.getByTestId('add-button').click()

  const items = page.getByTestId('todo-item')
  await expect(items).toHaveCount(1)
  await expect(page.getByTestId('todo-text').first()).toHaveText('Buy groceries')
  // Checkbox should be unchecked (aria-checked=false)
  await expect(page.getByTestId('todo-checkbox').first()).toHaveAttribute('aria-checked', 'false')

  await captureScreenshot(page, '01-add-todo')
})

// 1b. Add a todo via Enter key
test('happy path - add a todo with Enter key', async ({ page }) => {
  await page.getByTestId('todo-input').fill('Read a book')
  await page.getByTestId('todo-input').press('Enter')

  await expect(page.getByTestId('todo-item')).toHaveCount(1)
  await expect(page.getByTestId('todo-text').first()).toHaveText('Read a book')
})

// 2. Complete a todo
test('happy path - complete a todo', async ({ page }) => {
  await addTodo(page, 'Do laundry')
  await addTodo(page, 'Cook dinner')

  const countBefore = await page.getByTestId('active-count').textContent()
  expect(countBefore).toContain('2')

  // Click checkbox on first todo
  await page.getByTestId('todo-checkbox').first().click()

  // Text should have line-through
  await expect(page.getByTestId('todo-text').first()).toHaveClass(/line-through/)
  // Checkbox should now be checked
  await expect(page.getByTestId('todo-checkbox').first()).toHaveAttribute('aria-checked', 'true')
  // Count should decrement
  await expect(page.getByTestId('active-count')).toContainText('1')

  await captureScreenshot(page, '02-complete-todo')
})

// 3. Delete a todo
test('happy path - delete a todo', async ({ page }) => {
  await addTodo(page, 'Take out trash')
  await expect(page.getByTestId('todo-item')).toHaveCount(1)

  // Hover to reveal the delete button, then click it
  await page.getByTestId('todo-item').first().hover()
  await page.getByTestId('todo-delete').first().click()

  await expect(page.getByTestId('todo-item')).toHaveCount(0)
  await expect(page.getByTestId('empty-state')).toBeVisible()

  await captureScreenshot(page, '03-delete-todo')
})

// 4. Dark mode toggle
test('happy path - dark mode toggle', async ({ page }) => {
  // Start in light mode (default)
  const container = page.getByTestId('app-container')
  await expect(container).toHaveAttribute('data-theme', 'light')

  // Toggle to dark
  await page.getByTestId('theme-toggle').click()
  await expect(container).toHaveAttribute('data-theme', 'dark')
  // html element should have dark class
  await expect(page.locator('html')).toHaveClass(/dark/)

  await captureScreenshot(page, '04-dark-mode')

  // Toggle back to light
  await page.getByTestId('theme-toggle').click()
  await expect(container).toHaveAttribute('data-theme', 'light')
  await expect(page.locator('html')).not.toHaveClass(/dark/)

  await captureScreenshot(page, '04-light-mode')
})

// 5. Filter functionality
test('filter functionality', async ({ page }) => {
  await addTodo(page, 'Active task one')
  await addTodo(page, 'Active task two')
  await addTodo(page, 'Will be completed')

  // Complete the last one (first in the list, since new todos prepend)
  await page.getByTestId('todo-checkbox').first().click()

  // All filter — 3 todos
  await page.getByTestId('filter-all').click()
  await expect(page.getByTestId('todo-item')).toHaveCount(3)

  // Active filter — 2 incomplete todos
  await page.getByTestId('filter-active').click()
  await expect(page.getByTestId('todo-item')).toHaveCount(2)
  // Completed one should not appear
  const texts = await page.getByTestId('todo-text').allTextContents()
  expect(texts).not.toContain('Will be completed')

  // Completed filter — 1 completed todo
  await page.getByTestId('filter-completed').click()
  await expect(page.getByTestId('todo-item')).toHaveCount(1)
  await expect(page.getByTestId('todo-text').first()).toHaveText('Will be completed')

  // Back to All
  await page.getByTestId('filter-all').click()
  await expect(page.getByTestId('todo-item')).toHaveCount(3)

  await captureScreenshot(page, '05-filter')
})

// 6. Clear completed
test('clear completed', async ({ page }) => {
  await addTodo(page, 'Keep me')
  await addTodo(page, 'Remove me A')
  await addTodo(page, 'Remove me B')

  // Complete the top two (most recently added)
  await page.getByTestId('todo-checkbox').nth(0).click()
  await page.getByTestId('todo-checkbox').nth(1).click()

  await expect(page.getByTestId('active-count')).toContainText('1')

  await page.getByTestId('clear-completed').click()

  // Only the active one should remain
  await expect(page.getByTestId('todo-item')).toHaveCount(1)
  await expect(page.getByTestId('todo-text').first()).toHaveText('Keep me')
  // Clear Completed button should be gone
  await expect(page.getByTestId('clear-completed')).not.toBeVisible()

  await captureScreenshot(page, '06-clear-completed')
})

// 7. Data persistence — todos
test('data persistence - todos survive page refresh', async ({ page }) => {
  await addTodo(page, 'Persistent task one')
  await addTodo(page, 'Persistent task two')
  // Complete the second (first in list)
  await page.getByTestId('todo-checkbox').first().click()

  // Reload
  await page.reload()

  await expect(page.getByTestId('todo-item')).toHaveCount(2)
  // First item (most recent) should be completed
  await expect(page.getByTestId('todo-checkbox').first()).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByTestId('active-count')).toContainText('1')

  await captureScreenshot(page, '07-persistence-todos')
})

// 8. Data persistence — theme
test('data persistence - theme survives page refresh', async ({ page }) => {
  // Toggle to dark
  await page.getByTestId('theme-toggle').click()
  await expect(page.getByTestId('app-container')).toHaveAttribute('data-theme', 'dark')

  // Reload
  await page.reload()

  // Should still be dark
  await expect(page.getByTestId('app-container')).toHaveAttribute('data-theme', 'dark')
  await expect(page.locator('html')).toHaveClass(/dark/)

  await captureScreenshot(page, '08-persistence-theme')
})

// 9. Edge case — empty input
test('edge case - empty input does not add todo', async ({ page }) => {
  // Click Add with empty input
  await page.getByTestId('add-button').click()
  await expect(page.getByTestId('todo-item')).toHaveCount(0)
  await expect(page.getByTestId('empty-state')).toBeVisible()

  // Press Enter with whitespace only
  await page.getByTestId('todo-input').fill('   ')
  await page.getByTestId('todo-input').press('Enter')
  await expect(page.getByTestId('todo-item')).toHaveCount(0)

  await captureScreenshot(page, '09-empty-input')
})

// 10. Edge case — empty state
test('edge case - empty state shown when all todos deleted', async ({ page }) => {
  await addTodo(page, 'Temp task')
  await expect(page.getByTestId('empty-state')).not.toBeVisible()

  await page.getByTestId('todo-item').first().hover()
  await page.getByTestId('todo-delete').first().click()

  await expect(page.getByTestId('empty-state')).toBeVisible()

  await captureScreenshot(page, '10-empty-state')
})

// ─── Screenshot captures ──────────────────────────────────────────────────────

test('screenshot - light mode main view', async ({ page }) => {
  await addTodo(page, 'Buy groceries')
  await addTodo(page, 'Walk the dog')
  await addTodo(page, 'Read for 30 minutes')
  await addTodo(page, 'Call mom')
  // Complete one
  await page.getByTestId('todo-checkbox').nth(2).click()

  await captureScreenshot(page, 'screen-light-mode')
})

test('screenshot - dark mode main view', async ({ page }) => {
  await addTodo(page, 'Buy groceries')
  await addTodo(page, 'Walk the dog')
  await addTodo(page, 'Read for 30 minutes')
  await addTodo(page, 'Call mom')
  // Complete one
  await page.getByTestId('todo-checkbox').nth(2).click()

  // Switch to dark
  await page.getByTestId('theme-toggle').click()

  await captureScreenshot(page, 'screen-dark-mode')
})

test('screenshot - empty state view', async ({ page }) => {
  await captureScreenshot(page, 'screen-empty-state')
})
