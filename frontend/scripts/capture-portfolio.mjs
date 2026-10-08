import { chromium } from '@playwright/test'
import { copyFile, mkdir, rm } from 'node:fs/promises'
import path from 'node:path'

const mediaDir = path.resolve('../docs/media')
const videoDir = path.join(mediaDir, '.video')
const pause = (page, milliseconds = 650) => page.waitForTimeout(milliseconds)
const isoDate = days => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

await mkdir(mediaDir, { recursive: true })
await rm(videoDir, { recursive: true, force: true })
await mkdir(videoDir, { recursive: true })

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: videoDir, size: { width: 1440, height: 900 } },
})
const page = await context.newPage()
const video = page.video()
let recordedVideo
const unique = Date.now()

const screenshot = async name => {
  await pause(page, 350)
  await page.screenshot({ path: path.join(mediaDir, name), fullPage: true })
}

try {
  await page.goto('http://127.0.0.1:5173/')
  await page.getByLabel('Your name').fill('Alex Morgan')
  await page.getByLabel('Email').fill(`portfolio-${unique}@example.com`)
  await page.getByRole('textbox', { name: 'Password', exact: true }).fill('SplitTrip!2026')
  await page.getByRole('button', { name: 'Start your journey' }).click()
  await page.getByRole('heading', { name: /Good morning, Alex/ }).waitFor()
  await pause(page)

  await page.getByRole('button', { name: /Create trip/ }).first().click()
  const tripDialog = page.getByRole('dialog', { name: 'Where to next?' })
  await tripDialog.getByLabel('Trip name').fill('Aegean Summer Escape')
  await tripDialog.getByLabel('Destination').fill('Kaş, Türkiye')
  await tripDialog.getByLabel('Starts').fill(isoDate(30))
  await tripDialog.getByLabel('Ends').fill(isoDate(34))
  await tripDialog.getByLabel('Currency').selectOption('TRY')
  await tripDialog.getByLabel(/A little note/).fill('Five days of sea, food, and shared memories.')
  await tripDialog.getByRole('button', { name: 'Create trip →', exact: true }).click()
  await page.getByRole('heading', { name: 'Aegean Summer Escape' }).waitFor()
  await screenshot('dashboard-desktop.png')

  await page.getByRole('button', { name: /View trip/ }).click()
  await page.getByRole('heading', { name: 'Aegean Summer Escape' }).waitFor()
  await screenshot('trip-overview.png')

  await page.getByRole('button', { name: 'Itinerary', exact: true }).last().click()
  for (const idea of [
    { title: 'Sunset boat tour', location: 'Old Harbour', duration: '120', description: 'Swim in quiet coves before sunset.' },
    { title: 'Saklıkent canyon hike', location: 'Saklıkent', duration: '180', description: 'A cool morning walk through the canyon.' },
  ]) {
    await page.getByRole('button', { name: /Add idea/ }).click()
    const dialog = page.getByRole('dialog', { name: 'What should we do?' })
    await dialog.getByLabel('Activity name').fill(idea.title)
    await dialog.getByLabel(/Location/).fill(idea.location)
    await dialog.getByLabel('Estimated duration').selectOption(idea.duration)
    await dialog.getByLabel(/Why this one/).fill(idea.description)
    await dialog.getByRole('button', { name: /Share idea/ }).click()
  }
  await page.getByRole('button', { name: 'Like Sunset boat tour', exact: true }).click()
  await page.getByRole('heading', { name: 'Sunset boat tour' }).locator('..').getByRole('button', { name: 'Schedule' }).click()
  const scheduleDialog = page.getByRole('dialog', { name: 'Place it on the map.' })
  await scheduleDialog.getByLabel('Starts').fill('17:00')
  await scheduleDialog.getByLabel('Ends').fill('19:00')
  await scheduleDialog.getByLabel(/Plan note/).fill('Meet at the harbour entrance 15 minutes early.')
  await scheduleDialog.getByRole('button', { name: /Add to itinerary/ }).click()
  await screenshot('itinerary-planner.png')

  await page.getByRole('button', { name: 'Checklist', exact: true }).last().click()
  for (const [title, priority] of [['Book airport transfer', 'High'], ['Pack snorkeling gear', 'Medium']]) {
    await page.getByRole('button', { name: /Add task|Add your first task/ }).first().click()
    const dialog = page.getByRole('dialog', { name: 'What needs doing?' })
    await dialog.getByLabel('Task title').fill(title)
    await dialog.getByRole('button', { name: priority }).click()
    await dialog.getByRole('button', { name: /Create task/ }).click()
  }
  await page.getByRole('button', { name: 'Complete Book airport transfer' }).click()
  await screenshot('checklist-workspace.png')

  await page.getByRole('button', { name: 'Expenses', exact: true }).last().click()
  for (const [title, amount] of [['Harbour dinner', '2450'], ['Boat deposit', '1800']]) {
    await page.getByRole('button', { name: /Add expense|Add the first expense/ }).first().click()
    const dialog = page.getByRole('dialog', { name: 'Who picked up the tab?' })
    await dialog.getByLabel('What was it for?').fill(title)
    await dialog.getByLabel('Amount').fill(amount)
    await dialog.getByRole('button', { name: /Add expense/ }).click()
  }
  await screenshot('expense-ledger.png')

  await page.getByRole('button', { name: 'Balances', exact: true }).last().click()
  await screenshot('balances.png')

  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('button', { name: /Home/ }).click()
  await page.setViewportSize({ width: 390, height: 844 })
  await screenshot('dashboard-mobile.png')
} finally {
  await page.close()
  recordedVideo = video ? await video.path() : undefined
  await context.close()
  await browser.close()
}

if (recordedVideo) await copyFile(recordedVideo, path.join(mediaDir, 'splittrip-demo.webm'))
await rm(videoDir, { recursive: true, force: true })
console.log(`Portfolio media saved to ${mediaDir}`)
