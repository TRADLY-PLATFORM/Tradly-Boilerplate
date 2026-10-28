import { fileURLToPath } from 'node:url'
import { test } from '@e2e-dev/web'
import { expect } from 'e2e'
import { AppConfig } from '../config/app.config.ts'

test('seller can publish a free listing with category attributes, stock and shipping fields', async ({ app, browser, screen }) => {
  const domain = AppConfig.domain
  await browser.addInitScript((cookiePrefix: string) => {
    const profile = { id: 'e2e-seller', first_name: 'E2E', last_name: 'Seller', email: 'seller@example.test' }
    localStorage.setItem(`${cookiePrefix}_user_profile`, JSON.stringify(profile))
    document.cookie = `${cookiePrefix}_login=true; path=/`
    document.cookie = `${cookiePrefix}_logged_in_user_id=e2e-seller; path=/`
    document.cookie = `${cookiePrefix}_auth_key=e2e-auth-key; path=/`
    document.cookie = `${cookiePrefix}_refresh_key=e2e-refresh-key; path=/`
  }, domain)

  await browser.route('**/v1/users/token/refresh**', async route => route.fulfill({
    json: { status: true, data: { auth_key: 'e2e-auth-key', refresh_key: 'e2e-refresh-key' } },
  }))
  await browser.route('**/v1/accounts**', async route => route.fulfill({
    json: { status: true, data: { accounts: [{ id: 77, name: 'E2E Shop' }] } },
  }))
  await browser.route('**/v1/categories**', async route => {
    const type = new URL(route.request.url).searchParams.get('type')
    const categories = type === 'accounts' ? [{ id: 2, name: 'Seller' }] : [{ id: 4, name: 'Home goods' }]
    await route.fulfill({ json: { status: true, data: { categories } } })
  })
  await browser.route('**/v1/attributes**', async route => route.fulfill({
    json: {
      status: true,
      data: {
        attributes: [
          { id: 9, name: 'Condition', field_type: 1, active: true, optional: false, private: false, values: [{ id: 1, name: 'Used' }] },
          { id: 10, name: 'Colors', field_type: 2, active: true, optional: true, private: false, values: [{ id: 2, name: 'Blue' }, { id: 3, name: 'Green' }] },
        ],
      },
    },
  }))

  let submitted: { listing?: Record<string, unknown> } | undefined
  await browser.route('**/v1/listings**', async route => {
    if (route.request.method.toUpperCase() === 'POST') {
      submitted = JSON.parse(route.request.postData ?? '{}') as { listing?: Record<string, unknown> }
      await route.fulfill({ json: { status: true, data: { listing: { id: 9001, slug: 'e2e-free-item' } } } })
      return
    }
    await route.fulfill({ json: { status: true, data: { listings: [], page: 1, total_records: 0 } } })
  })
  await browser.route('**/v1/utils/S3signedUploadURL**', async route => route.fulfill({
    json: { status: true, data: { result: [{ signedUrl: 'https://upload.example.test/photo', fileUri: 'https://media.example.test/photo.jpg' }] } },
  }))
  await browser.route('https://upload.example.test/**', async route => route.fulfill({ status: 200, body: '' }))

  await app.open('/sell')
  await expect(screen.getByRole('heading', 'Sell or share an item')).toBeVisible()
  await screen.getByLabel('Title').fill('E2E free chair')
  await screen.getByLabel('Description').fill('A free chair in good condition')
  await screen.getByLabel('Listing type').selectOption({ value: 'listings' })
  await screen.getByLabel('Category').selectOption({ value: '4' })
  await screen.getByLabel('Price').fill('0')
  await screen.getByLabel('Available quantity').fill('5')
  await screen.getByRole('combobox', 'Condition *').selectOption({ value: '1' })
  await screen.getByRole('checkbox', 'Blue').tap()

  await screen.getByText('Inventory, shipping and product details').tap()
  await screen.getByLabel('Maximum per order').fill('2')
  await screen.getByLabel('Discount (%)').fill('10')
  await screen.getByLabel('Shipping charge').fill('7.50')
  await screen.getByLabel('SKU').fill('CHAIR-001')
  await screen.getByLabel('GTIN').fill('00012345678905')
  await screen.getByLabel('MPN').fill('MFR-CH-01')
  await screen.getByLabel('Weight').fill('4')
  await screen.getByLabel('Weight unit').selectOption({ value: 'kg' })
  await screen.getByLabel('Length').fill('80')
  await screen.getByLabel('Width').fill('60')
  await screen.getByLabel('Height').fill('90')
  await screen.getByLabel('Volume').fill('0.4')
  await screen.getByLabel('Dimension unit').selectOption({ value: 'cm' })
  await screen.getByLabel('Photos').setInputFiles(fileURLToPath(new URL('./fixtures/listing-photo.svg', import.meta.url)))
  await expect(screen.getByRole('img', 'Listing photo 1')).toBeVisible()
  await screen.getByRole('button', 'Publish listing').tap()

  await expect(browser).toHaveURL('/listing/e2e-free-item')
  expect(submitted?.listing).toMatchObject({
    title: 'E2E free chair',
    description: 'A free chair in good condition',
    type: 'listings',
    order_type: 'listings',
    account_id: 77,
    category_id: [4],
    images: ['https://media.example.test/photo.jpg'],
    list_price: 0,
    stock: 5,
    max_quantity: 2,
    offer_percent: 10,
    shipping_charges: 7.5,
    sku: 'CHAIR-001',
    gtin: '00012345678905',
    mpn: 'MFR-CH-01',
    weight_value: 4,
    weight_uom: 'kg',
    length: 80,
    width: 60,
    height: 90,
    size_uom: 'cm',
    volume_value: 0.4,
    volume_uom: 'l',
    attributes: [{ id: 9, values: ['1'] }, { id: 10, values: ['2'] }],
  })
})

test('seller can publish an appointment with date range, daily hours and slot capacity', async ({ app, browser, screen }) => {
  await browser.addInitScript((cookiePrefix: string) => {
    localStorage.setItem(`${cookiePrefix}_user_profile`, JSON.stringify({ id: 'e2e-seller', first_name: 'E2E', last_name: 'Seller', email: 'seller@example.test' }))
    document.cookie = `${cookiePrefix}_login=true; path=/`
    document.cookie = `${cookiePrefix}_logged_in_user_id=e2e-seller; path=/`
    document.cookie = `${cookiePrefix}_auth_key=e2e-auth-key; path=/`
    document.cookie = `${cookiePrefix}_refresh_key=e2e-refresh-key; path=/`
  }, AppConfig.domain)
  await browser.route('**/v1/users/token/refresh**', route => route.fulfill({ json: { status: true, data: { auth_key: 'e2e-auth-key', refresh_key: 'e2e-refresh-key' } } }))
  await browser.route('**/v1/accounts**', route => route.fulfill({ json: { status: true, data: { accounts: [{ id: 77, name: 'E2E Shop' }] } } }))
  await browser.route('**/v1/categories**', async route => {
    const type = new URL(route.request.url).searchParams.get('type')
    await route.fulfill({ json: { status: true, data: { categories: type === 'accounts' ? [] : [{ id: 4, name: 'Services' }] } } })
  })
  await browser.route('**/v1/attributes**', route => route.fulfill({ json: { status: true, data: { attributes: [] } } }))
  await browser.route('**/v1/listings**', route => route.fulfill({ json: { status: true, data: { listing: { id: 9002, slug: 'e2e-appointment' } } } }))
  let availability: any
  await browser.route('**/v1/listings/9002/schedules**', async route => {
    availability = JSON.parse(route.request.postData ?? '{}')
    await route.fulfill({ json: { status: true, data: {} } })
  })
  await browser.route('**/v1/utils/S3signedUploadURL**', route => route.fulfill({ json: { status: true, data: { result: [{ signedUrl: 'https://upload.example.test/appointment', fileUri: 'https://media.example.test/appointment.jpg' }] } } }))
  await browser.route('https://upload.example.test/**', route => route.fulfill({ status: 200, body: '' }))

  await app.open('/sell')
  await screen.getByLabel('Title').fill('E2E Appointment')
  await screen.getByLabel('Description').fill('Book a test service')
  await screen.getByLabel('Listing type').selectOption({ value: 'appointments' })
  await screen.getByLabel('Category').selectOption({ value: '4' })
  await screen.getByLabel('Price').fill('25')
  await screen.getByLabel('First date').fill('2026-11-01')
  await screen.getByLabel('Last date').fill('2026-11-30')
  await screen.getByLabel('Start time').fill('10:00')
  await screen.getByLabel('End time').fill('17:00')
  await screen.getByLabel('Capacity per slot').fill('3')
  await screen.getByLabel('Photos').setInputFiles(fileURLToPath(new URL('./fixtures/listing-photo.svg', import.meta.url)))
  await screen.getByRole('button', 'Publish listing').tap()

  await expect(browser).toHaveURL('/booking/e2e-appointment')
  expect(availability).toMatchObject({ schedules: [{
    start_date: '2026-11-01', end_date: '2026-11-30', start_time: '10:00', end_time: '17:00',
    schedule_type: 1, active: true, total_stocks: 3,
  }] })
})
