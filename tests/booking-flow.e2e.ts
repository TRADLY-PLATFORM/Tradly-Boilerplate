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
    return route.fulfill({ json: { status: true, data: { cart: {
      id: 77, total: { amount: 25, formatted: '$25.00' }, list_total: { amount: 25, formatted: '$25.00' }, offer_total: { amount: 25, formatted: '$25.00' }, shipping_total: { amount: 0, formatted: '$0.00' }, grand_total: { amount: 25, formatted: '$25.00' }, pricing_items: [],
    }, cart_details: [{ id: 4, listing: { id: 501, slug: 'e2e-appointment', title: 'E2E Appointment', images: [], order_type: 'appointments', offer_price: { amount: 25, formatted: '$25.00' }, account: { name: 'Test Seller' } }, quantity: 1, quantity_total_offer_price: { amount: 25, formatted: '$25.00' }, schedule_start_at: null, schedule_end_at: null }] } } })
  })
  await browser.route('**/v1/tenants/payment_methods**', route => route.fulfill({ json: { status: true, data: { payment_methods: [{ id: 9952, name: 'Test COD', type: 'cod', channel: 'cod', active: true }] } } }))
  await browser.route('**/v1/commissions**', route => route.fulfill({ json: { status: true, data: { commissions: [] } } }))
  let checkoutBody: any
  await browser.route('**/v1/cart/checkout**', async route => {
    checkoutBody = JSON.parse(route.request.postData ?? '{}')
    await route.fulfill({ json: { status: true, data: { order_reference: 'BOOKING-E2E-1' } } })
  })

  await app.open('/l/e2e-appointment')
  await expect(screen.getByRole('heading', 'E2E Appointment')).toBeVisible()
  await screen.getByRole('button', '10:00 – 10:30 2 left').tap()
  await screen.getByRole('button', 'Continue to cart').tap()
  await expect(browser).toHaveURL('/cart?booking_schedule_id=8001&booking_day=2026-10-26&booking_start_time=10%3A00&booking_end_time=10%3A30')
  await expect(screen.getByText('Booking date: Mon, Oct 26, 2026 · 10:00 AM – 10:30 AM')).toBeVisible()
  await screen.getByRole('button', 'Proceed to checkout').tap()
  await expect(browser).toHaveURL('/checkout?booking_schedule_id=8001&booking_day=2026-10-26&booking_start_time=10%3A00&booking_end_time=10%3A30')
  await screen.getByRole('button', 'Place order').tap()
  expect(checkoutBody.order).toMatchObject({
    schedule_id: 8001,
    schedule_start_at: '2026-10-26 10:00:00',
    schedule_end_at: '2026-10-26 10:30:00',
  })
  expect(checkoutBody.order.payment_method_id).toBe(9952)
})

test('every listing opens at /l/:slug and the page shows the booking picker for scheduled listings; old per-type URLs forward there', async ({ app, browser, screen }) => {
  await browser.route('**/v1/listings/by_slug/e2e-appointment**', route => route.fulfill({ json: { status: true, data: { listing: {
    id: 501, slug: 'e2e-appointment', title: 'E2E Appointment', description: 'A test booking slot', images: [], order_type: 'appointments',
    offer_price: { formatted: '$25.00' }, list_price: { formatted: '$25.00' }, account: { name: 'Test Seller' },
    rating_data: { rating_count: 0, rating_average: 0 }, stock: 5, goal_price: { amount: 0 }, likes: 0,
  } } } }))

  await app.open('/l/e2e-appointment')
  await expect(browser).toHaveURL('/l/e2e-appointment')
  await expect(screen.getByRole('heading', 'E2E Appointment')).toBeVisible()
  await app.open('/booking/e2e-appointment')
  await expect(browser).toHaveURL('/l/e2e-appointment')
  await app.open('/listing/e2e-appointment')
  await expect(browser).toHaveURL('/l/e2e-appointment')
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

test('rental orders open a dedicated reservation page and keep standard order details available', async ({ app, browser, screen }) => {
  await signIn(browser)
  await browser.route('**/v1/users/token/refresh**', route => route.fulfill({ json: { status: true, data: { auth_key: 'booking-auth', refresh_key: 'booking-refresh' } } }))
  await browser.route('**/v1/orders/404**', route => route.fulfill({ json: { status: true, data: { order: {
    id: 404, order_reference: 'RENT-404', order_status: 2, type: 'listings', created_at: 1794456000,
    order_details: [{ id: 8, listing_id: 700, quantity: 2, schedule_start_at: '2026-11-12T00:00:00.000Z', schedule_end_at: '2026-11-14T00:00:00.000Z', listing: { slug: 'rental-bike', title: 'Rental bike', order_type: 'rental', images: [], listing_rental_settings: { rate_unit: 'day', rate_amount: 20, min_duration: 1, max_duration: 10, buffer_time: 0, deposit_amount: 50, max_units: 5 }, offer_price: { amount: 20, formatted: '$20.00', currency: 'USD' } } }],
  } } } }))
  await app.open('/orders/404')
  await expect(browser).toHaveURL('/rental/orders/404')
  await expect(screen.getByRole('heading', 'Rental dates')).toBeVisible()
  await expect(screen.getByText('Rental dates:')).toBeVisible()
  await expect(screen.getByText(/Nov 12, 2026.*Nov 14, 2026/).first()).toBeVisible()
  await expect(screen.getByText('Units:')).toBeVisible()
  await expect(screen.getByText('Units: 2')).toBeVisible()
  await expect(screen.getByText('Deposit:')).toBeVisible()
  await expect(screen.getByText(/50\.00/)).toBeVisible()
  await app.open('/orders/404?view=standard')
  await expect(screen.getByRole('heading', 'Items')).toBeVisible()
  await expect(screen.getByRole('link', 'Rental reservation')).toBeVisible()
})

test('orders list shows the appointment date and time', async ({ app, browser, screen }) => {
  await signIn(browser)
  await browser.route('**/v1/users/token/refresh**', route => route.fulfill({ json: { status: true, data: { auth_key: 'booking-auth', refresh_key: 'booking-refresh' } } }))
  await browser.route('**/*', async route => {
    const path = new URL(route.request.url).pathname
    if (path.startsWith('/v1/users/token/refresh')) return route.fulfill({ json: { status: true, data: { auth_key: 'booking-auth', refresh_key: 'booking-refresh' } } })
    if (path.startsWith('/v1/orders')) return route.fulfill({ json: { status: true, data: { page: 1, total_records: 1, orders: [{
      id: 303, order_reference: 'BOOK-303', order_status: 2, type: 'appointments', created_at: 1794456000,
      order_details: [{ id: 7, listing_id: 501, schedule_start_at: '2026-11-12 10:00:00', schedule_end_at: '2026-11-12 10:30:00', listing: { slug: 'e2e-appointment', title: 'E2E Appointment', images: [], order_type: 'appointments' } }],
      grand_total: { formatted: '$25.00' },
    }] } } })
    return route.continue()
  })
  await app.open('/orders')
  await expect(screen.getByText(/Booking date: Thu, Nov 12, 2026/)).toBeVisible()
})

test('rental thank-you page confirms dates, units, and deposit', async ({ app, browser, screen }) => {
  await browser.route('**/v1/orders/THANK-RENT', route => route.fulfill({ json: { status: true, data: { order: {
    id: 405, order_reference: 'THANK-RENT', order_status: 2, type: 'listings',
    order_details: [{ id: 9, listing_id: 700, quantity: 3, schedule_start_at: '2026-11-12T00:00:00.000Z', schedule_end_at: '2026-11-14T00:00:00.000Z', offer_price: { formatted: '$20.00' }, listing: { slug: 'rental-bike', title: 'Rental bike', images: [], order_type: 'rental', listing_rental_settings: { rate_unit: 'day', rate_amount: 20, min_duration: 1, max_duration: 10, buffer_time: 0, deposit_amount: 50, max_units: 5 } } }],
  } } } }))
  await app.open('/checkouts/THANK-RENT/thank-you')
  await expect(screen.getByRole('heading', 'Order placed!')).toBeVisible()
  await expect(screen.getByText('Rental dates:')).toBeVisible()
  await expect(screen.getByText('Units:')).toBeVisible()
  await expect(screen.getByText('Deposit:')).toBeVisible()
  await expect(screen.getByText(/50\.00/)).toBeVisible()
})
