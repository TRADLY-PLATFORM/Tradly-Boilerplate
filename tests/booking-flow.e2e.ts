import { test } from '@e2e-dev/web'
import { expect } from 'e2e'
import { AppConfig } from '../config/app.config.ts'

const signIn = async (browser: any) => {
  await browser.addInitScript((prefix: string) => {
    localStorage.setItem(`${prefix}_user_profile`, JSON.stringify({ id: 'booking-buyer', first_name: 'Booking', last_name: 'Buyer', email: 'buyer@example.test' }))
    document.cookie = `${prefix}_login=true; path=/`
    document.cookie = `${prefix}_logged_in_user_id=booking-buyer; path=/`
    document.cookie = `${prefix}_auth_key=booking-auth; path=/`
    document.cookie = `${prefix}_refresh_key=booking-refresh; path=/`
  }, AppConfig.domain)
}

test('buyer sends the selected appointment start and end times in the checkout order', async ({ app, browser, screen }) => {
  await signIn(browser)
  await browser.route('**/v1/users/token/refresh**', route => route.fulfill({ json: { status: true, data: { auth_key: 'booking-auth', refresh_key: 'booking-refresh' } } }))
  await browser.route('**/v1/listings/by_slug/e2e-appointment**', route => route.fulfill({ json: { status: true, data: { listing: {
    id: 501, slug: 'e2e-appointment', title: 'E2E Appointment', description: 'A test booking slot', images: [], order_type: 'appointments',
    offer_price: { formatted: '$25.00' }, list_price: { formatted: '$25.00' }, account: { name: 'Test Seller' },
  } } } }))
  await browser.route('**/v1/listings/501/schedules_per_day**', route => route.fulfill({ json: { status: true, data: [
    { day: '2026-10-26', schedules: [{ id: 8001, start_time: '10:00', end_time: '10:30', available: true, stocks_left: 2 }] },
  ] } }))
  await browser.route('**/v1/cart**', async route => {
    if (route.request.method.toUpperCase() === 'DELETE') return route.fulfill({ json: { status: true, data: {} } })
    if (route.request.method.toUpperCase() === 'POST') return route.fulfill({ json: { status: true, data: { cart: { id: 77 }, cart_details: [] } } })
    return route.fulfill({ json: { status: true, data: { cart: { id: 77 }, cart_details: [{ id: 4, listing: { id: 501, order_type: 'appointments' }, quantity: 1 }] } } })
  })
  await browser.route('**/v1/tenants/payment_methods**', route => route.fulfill({ json: { status: true, data: { payment_methods: [{ id: 9952, name: 'Test COD', type: 'cod', channel: 'cod', active: true }] } } }))
  await browser.route('**/v1/commissions**', route => route.fulfill({ json: { status: true, data: { commissions: [] } } }))
  let checkoutBody: any
  await browser.route('**/v1/cart/checkout**', async route => {
    checkoutBody = JSON.parse(route.request.postData ?? '{}')
    await route.fulfill({ json: { status: true, data: { order_reference: 'BOOKING-E2E-1' } } })
  })

  await app.open('/booking/e2e-appointment')
  await expect(screen.getByRole('heading', 'E2E Appointment')).toBeVisible()
  await screen.getByRole('button', '10:00 – 10:30 2 left').tap()
  await screen.getByRole('button', 'Continue to checkout').tap()
  await expect(browser).toHaveURL('/checkout?booking_schedule_id=8001&booking_day=2026-10-26')
  await screen.getByRole('button', 'Place order').tap()
  expect(checkoutBody.order).toMatchObject({
    schedule_id: 8001,
    schedule_start_at: '2026-10-26 10:00:00',
    schedule_end_at: '2026-10-26 10:30:00',
  })
  expect(checkoutBody.order.payment_method_id).toBe(9952)
})

test('scheduled listing URLs route by order type, with a standard-detail override', async ({ app, browser, screen }) => {
  await browser.route('**/v1/listings/by_slug/e2e-appointment**', route => route.fulfill({ json: { status: true, data: { listing: {
    id: 501, slug: 'e2e-appointment', title: 'E2E Appointment', description: 'A test booking slot', images: [], order_type: 'appointments',
    offer_price: { formatted: '$25.00' }, list_price: { formatted: '$25.00' }, account: { name: 'Test Seller' },
    rating_data: { rating_count: 0, rating_average: 0 }, stock: 5, goal_price: { amount: 0 }, likes: 0,
  } } } }))

  await app.open('/listing/e2e-appointment')
  await expect(browser).toHaveURL('/booking/e2e-appointment')
  await app.open('/listing/e2e-appointment?view=standard')
  await expect(screen.getByRole('heading', 'E2E Appointment')).toBeVisible()
  await expect(screen.getByRole('button', 'Book appointment')).toBeVisible()
})

test('booking orders open the calendar by order type, with regular order details available as an override', async ({ app, browser, screen }) => {
  await signIn(browser)
  await browser.route('**/v1/users/token/refresh**', route => route.fulfill({ json: { status: true, data: { auth_key: 'booking-auth', refresh_key: 'booking-refresh' } } }))
  await browser.route('**/v1/orders/303**', route => route.fulfill({ json: { status: true, data: { order: {
    id: 303, order_reference: 'BOOK-303', order_status: 2, type: 'appointments', account: { name: 'Test Seller' },
    order_details: [{ id: 7, listing_id: 501, schedule_start_at: '2026-11-12 10:00:00', schedule_end_at: '2026-11-12 10:30:00', listing: { slug: 'e2e-appointment', title: 'E2E Appointment', images: [] } }],
  } } } }))

  await app.open('/orders/303')
  await expect(browser).toHaveURL('/booking/orders/303')
  await expect(screen.getByRole('heading', 'Your booking')).toBeVisible()
  await expect(screen.getByText('November 2026')).toBeVisible()
  await expect(screen.getByRole('link', 'Standard order view')).toBeVisible()
  await expect(screen.getByText('Thursday, November 12, 2026')).toBeVisible()

  await app.open('/orders/303?view=standard')
  await expect(screen.getByRole('heading', 'Items')).toBeVisible()
  await expect(screen.getByRole('link', 'View booking calendar')).toBeVisible()
})
