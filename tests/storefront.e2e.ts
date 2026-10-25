import { test } from '@e2e-dev/web'
import { expect } from 'e2e'

test('home page loads listings from the configured Tradly workspace', async ({ app, browser }) => {
  await app.open('/')
  const listingResponse = browser.waitForResponse('**/v1/listings**')
  await browser.reload()

  const response = await listingResponse
  expect(response.status).toBe(200)
})

test('Sell navigation sends signed-out sellers to sign in and preserves the destination', async ({ app, browser }) => {
  await app.open('/')
  await browser.goto('/sell')
  await expect(browser).toHaveURL('/sign-in?next=%2Fsell')
})

test('protected order pages send unauthenticated visitors to sign in', async ({ app, browser }) => {
  await app.open('/orders')

  await expect(browser).toHaveURL('/sign-in?next=%2Forders')
})
