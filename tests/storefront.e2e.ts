import { test } from '@e2e-dev/web'
import { expect } from 'e2e'

test('home page loads listings from the configured Tradly workspace', async ({ app, browser }) => {
  const listingResponse = browser.waitForResponse('**/products/v1/listings**')

  await app.open('/')

  const response = await listingResponse
  expect(response.status).toBe(200)
})

test('home page loads the guest cart from the configured Tradly workspace', async ({ app, browser }) => {
  const cartResponse = browser.waitForResponse('**/products/v1/cart**')

  await app.open('/')

  const response = await cartResponse
  expect(response.status).toBe(200)
})

test('protected order pages send unauthenticated visitors to sign in', async ({ app, browser }) => {
  await app.open('/orders')

  await expect(browser).toHaveURL('/sign-in')
})
