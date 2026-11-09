import { test } from '@e2e-dev/web'
import { expect } from 'e2e'
import { AppConfig } from '../config/app.config.ts'

test('buyer selects a room variant, confirms date availability, and adds that variant to the rental cart', async ({ app, browser, screen }) => {
  await browser.addInitScript((prefix: string) => {
    localStorage.setItem(`${prefix}_user_profile`, JSON.stringify({ id: 'hotel-buyer', first_name: 'Hotel', last_name: 'Buyer', email: 'buyer@example.test' }))
    document.cookie = `${prefix}_login=true; path=/`
    document.cookie = `${prefix}_logged_in_user_id=hotel-buyer; path=/`
    document.cookie = `${prefix}_auth_key=hotel-auth; path=/`
    document.cookie = `${prefix}_refresh_key=hotel-refresh; path=/`
  }, AppConfig.domain)
  await browser.route('**/v1/users/token/refresh**', route => route.fulfill({ json: { status: true, data: { auth_key: 'hotel-auth', refresh_key: 'hotel-refresh' } } }))
  await browser.route('**/v1/listings/by_slug/e2e-hotel**', route => route.fulfill({ json: { status: true, data: { listing: {
    id: 9301, slug: 'e2e-hotel', title: 'E2E Hotel', description: 'A test hotel room', images: [], order_type: 'rental', type: 'rental', stock: 8,
    list_price: { amount: 100, formatted: '$100.00', currency: 'USD' }, offer_price: { amount: 100, formatted: '$100.00', currency: 'USD' },
    listing_rental_settings: { rate_unit: 'day', rate_amount: 100, min_duration: 1, max_duration: 30, buffer_time: 0, deposit_amount: 40, max_units: 8 },
    account: { name: 'E2E Hotel' }, rating_data: { rating_count: 0, rating_average: 0 }, metadata: { cancellation_policy: 'Free cancellation up to 48 hours before check-in.' },
  } } } }))
  await browser.route('**/v1/listings/9301/variants', route => route.fulfill({ json: { status: true, data: { variants: [
    { id: 77, title: 'Deluxe room', list_price: { amount: 150, formatted: '$150.00', currency: 'USD' }, offer_price: { amount: 130, formatted: '$130.00', currency: 'USD' }, stock: 2, active: true, variant_values: [] },
  ] } } }))
  let availabilityQuery: URLSearchParams | undefined
  await browser.route('**/v1/rentals/availability**', async route => {
    availabilityQuery = new URL(route.request.url).searchParams
    await route.fulfill({ json: { status: true, data: { available: 2, requested: 2, price: 780, deposit: 40 } } })
  })
  let addedCart: any
  await browser.route('**/v1/cart', async route => {
    const method = route.request.method.toUpperCase()
    if (method === 'DELETE') return route.fulfill({ json: { status: true, data: {} } })
    if (method === 'POST') {
      addedCart = JSON.parse(route.request.postData ?? '{}').cart
      return route.fulfill({ json: { status: true, data: { cart: { id: 77 }, cart_details: [] } } })
    }
    return route.fulfill({ json: { status: true, data: { cart: {
      id: 77, total: { amount: 780, formatted: '$780.00' }, list_total: { amount: 780, formatted: '$780.00' }, offer_total: { amount: 780, formatted: '$780.00' }, shipping_total: { amount: 0, formatted: '$0.00' }, grand_total: { amount: 780, formatted: '$780.00' }, pricing_items: [],
    }, cart_details: [{ id: 1, listing: { id: 9301, slug: 'e2e-hotel', title: 'E2E Hotel', images: [], order_type: 'rental', offer_price: { amount: 130, formatted: '$130.00', currency: 'USD' }, account: { name: 'E2E Hotel' } }, variant: { id: 77, name: 'Deluxe room' }, quantity: 2, quantity_total_offer_price: { amount: 780, formatted: '$780.00' }, schedule_start_at: null, schedule_end_at: null }] } } })
  })

  await app.open('/l/e2e-hotel?start_at=2026-12-01&end_at=2026-12-04&units=1')
  await expect(screen.getByRole('heading', 'E2E Hotel')).toBeVisible()
  await screen.getByRole('radio', /Deluxe room/).tap()
  await screen.getByLabel('Units').fill('2')
  await screen.getByLabel('Adults').fill('2')
  await screen.getByLabel('Children').fill('1')
  await expect(screen.getByText('Nights')).toBeVisible()
  await expect(screen.getByText('$780.00')).toBeVisible()
  await expect(screen.getByText('Free cancellation up to 48 hours before check-in.')).toBeVisible()
  await screen.getByLabel('I have read and accept this cancellation policy.').tap()
  await expect(screen.getByText('Available for your dates. Rental total: $780.00').first()).toBeVisible()
  await expect(screen.getByRole('button', 'Continue to cart')).toBeEnabled()
  await screen.getByRole('button', 'Continue to cart').tap()
  await expect(browser).toHaveURL(/\/cart\?rental_start_at=.*rental_adults=2&rental_children=1&rental_variant_id=77/)
  expect(availabilityQuery?.get('listing_id')).toBe('9301')
  expect(availabilityQuery?.get('units')).toBe('2')
  expect(addedCart).toMatchObject({
    listing_id: 9301,
    quantity: 2,
    variant_id: 77,
    rental_start_at: expect.any(String),
    rental_end_at: expect.any(String),
  })
  expect(addedCart.rental_start_at).toBe(availabilityQuery?.get('start_at'))
  expect(addedCart.rental_end_at).toBe(availabilityQuery?.get('end_at'))
})
