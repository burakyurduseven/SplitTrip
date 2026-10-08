import { expect, test, type Page, type TestInfo } from '@playwright/test'

const isoDate = (daysFromToday: number) => {
  const date = new Date()
  date.setDate(date.getDate() + daysFromToday)
  return date.toISOString().slice(0, 10)
}

const register = async (page: Page, testInfo: TestInfo) => {
  const unique = `${testInfo.project.name}-${Date.now()}`.replace(/[^a-z0-9-]/gi, '').toLowerCase()
  const email = `splittrip-${unique}@example.com`
  const password = 'SplitTrip!2026'
  await page.goto('/')
  await page.getByLabel('Your name').fill('E2E Traveller')
  await page.getByLabel('Email').fill(email)
  await page.getByRole('textbox', { name: 'Password', exact: true }).fill(password)
  await page.getByRole('button', { name: 'Start your journey' }).click()
  await expect(page.getByRole('heading', { name: /Good (morning|afternoon|evening), E2E/ })).toBeVisible()

  const logoutResponse = await page.request.delete('/api/v1/auth/logout')
  expect(logoutResponse.ok()).toBeTruthy()
  await page.goto('/')
  await page.getByRole('tab', { name: 'Log in' }).click()
  await page.getByLabel('Email').fill(email)
  await page.getByRole('textbox', { name: 'Password', exact: true }).fill(password)
  await page.getByRole('button', { name: 'Continue your journey' }).click()
  await expect(page.getByRole('heading', { name: /Good (morning|afternoon|evening), E2E/ })).toBeVisible()
}

const createTrip = async (page: Page, title: string) => {
  await page.getByRole('button', { name: /Create trip/ }).first().click()
  const dialog = page.getByRole('dialog', { name: 'Where to next?' })
  await dialog.getByLabel('Trip name').fill(title)
  await dialog.getByLabel('Destination').fill('Kaş, Türkiye')
  await dialog.getByLabel('Starts').fill(isoDate(30))
  await dialog.getByLabel('Ends').fill(isoDate(33))
  await dialog.getByLabel('Currency').selectOption('TRY')
  await dialog.getByLabel(/A little note/).fill('Created by the end-to-end test')
  await dialog.getByRole('button', { name: 'Create trip →', exact: true }).click()
  await expect(page.getByRole('heading', { name: title })).toBeVisible()
  await page.getByRole('button', { name: /View trip/ }).click()
  await expect(page.getByRole('heading', { name: title })).toBeVisible()
}

test('traveller can plan a trip from registration through expenses', async ({ page }, testInfo) => {
  const suffix = testInfo.project.name === 'mobile-chromium' ? 'Mobile' : 'Desktop'
  const tripTitle = `E2E ${suffix} Escape`
  const activityTitle = `Sunset cruise ${suffix}`
  const taskTitle = `Pack passport ${suffix}`
  const expenseTitle = `Harbour dinner ${suffix}`

  await register(page, testInfo)
  await createTrip(page, tripTitle)

  await page.getByRole('button', { name: 'Itinerary', exact: true }).last().click()
  await expect(page.getByRole('heading', { name: 'Idea pool' })).toBeVisible()
  await page.getByRole('button', { name: /Add idea/ }).click()
  const ideaDialog = page.getByRole('dialog', { name: 'What should we do?' })
  await ideaDialog.getByLabel('Activity name').fill(activityTitle)
  await ideaDialog.getByLabel(/Location/).fill('Old harbour')
  await ideaDialog.getByRole('button', { name: /Share idea/ }).click()
  await expect(page.getByRole('heading', { name: activityTitle })).toBeVisible()
  await page.getByRole('button', { name: `Like ${activityTitle}`, exact: true }).click()
  await page.getByRole('button', { name: 'Schedule', exact: true }).click()
  const scheduleDialog = page.getByRole('dialog', { name: 'Place it on the map.' })
  await scheduleDialog.getByLabel('Starts').fill('09:00')
  await scheduleDialog.getByLabel('Ends').fill('11:00')
  await scheduleDialog.getByRole('button', { name: /Add to itinerary/ }).click()
  await expect(page.getByText('09:00–11:00')).toBeVisible()

  await page.getByRole('button', { name: 'Checklist', exact: true }).last().click()
  await page.getByRole('button', { name: /Add task|Add your first task/ }).first().click()
  const taskDialog = page.getByRole('dialog', { name: 'What needs doing?' })
  await taskDialog.getByLabel('Task title').fill(taskTitle)
  await taskDialog.getByRole('button', { name: 'High' }).click()
  await taskDialog.getByRole('button', { name: /Create task/ }).click()
  await expect(page.getByRole('heading', { name: taskTitle })).toBeVisible()
  await page.getByRole('button', { name: `Complete ${taskTitle}` }).click()
  await expect(page.getByRole('button', { name: `Reopen ${taskTitle}` })).toBeVisible()

  await page.getByRole('button', { name: 'Expenses', exact: true }).last().click()
  await page.getByRole('button', { name: /Add expense|Add the first expense/ }).first().click()
  const expenseDialog = page.getByRole('dialog', { name: 'Who picked up the tab?' })
  await expenseDialog.getByLabel('What was it for?').fill(expenseTitle)
  await expenseDialog.getByLabel('Amount').fill('1200')
  await expenseDialog.getByRole('button', { name: /Add expense/ }).click()
  await expect(page.getByRole('heading', { name: expenseTitle })).toBeVisible()

  await page.getByRole('button', { name: `Edit ${expenseTitle}` }).click()
  const editDialog = page.getByRole('dialog', { name: 'Change the expense.' })
  await editDialog.getByLabel('Amount').fill('1250')
  await editDialog.getByRole('button', { name: /Save changes/ }).click()
  await expect(page.getByText(/TRY 1,250/).first()).toBeVisible()

  await page.getByRole('button', { name: 'Balances', exact: true }).last().click()
  await expect(page.getByText(/All settled up|Everyone is even/).first()).toBeVisible()

  await page.getByRole('button', { name: 'Expenses', exact: true }).last().click()
  await page.getByRole('button', { name: `Edit ${expenseTitle}` }).click()
  page.once('dialog', dialog => dialog.accept())
  await page.getByRole('dialog', { name: 'Change the expense.' }).getByRole('button', { name: 'Delete expense' }).click()
  await expect(page.getByRole('heading', { name: expenseTitle })).toHaveCount(0)
})

test('mobile navigation exposes the primary workflow', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'Mobile-only responsive smoke test')
  await register(page, testInfo)
  const mobileNavigation = page.getByRole('navigation', { name: 'Mobile navigation' })
  await expect(mobileNavigation).toBeVisible()
  await expect(mobileNavigation.getByRole('button', { name: /Trips/ })).toBeVisible()
  await expect(mobileNavigation.getByRole('button', { name: /Itinerary/ })).toBeVisible()
  await expect(mobileNavigation.getByRole('button', { name: /Create/ })).toBeVisible()
  await expect(mobileNavigation.getByRole('button', { name: /Expenses/ })).toBeVisible()
  await expect(mobileNavigation.getByRole('button', { name: /Balances/ })).toBeVisible()
})
