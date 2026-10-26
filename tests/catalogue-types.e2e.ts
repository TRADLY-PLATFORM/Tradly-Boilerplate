import { test } from '@e2e-dev/web'
import { expect } from 'e2e'
import { AppConfig } from '../config/app.config.ts'

const signIn = async (browser: any) => {
  await browser.addInitScript((prefix: string) => {
    localStorage.setItem(`${prefix}_user_profile`, JSON.stringify({ id: 'catalogue-buyer', first_name: 'Test', last_name: 'Buyer', email: 'buyer@example.test' }))
    document.cookie = `${prefix}_login=true; path=/`
    document.cookie = `${prefix}_logged_in_user_id=catalogue-buyer; path=/`
    document.cookie = `${prefix}_auth_key=catalogue-auth; path=/`
    document.cookie = `${prefix}_refresh_key=catalogue-refresh; path=/`
  }, AppConfig.domain)
}

const listing = (overrides: Record<string, unknown> = {}) => ({
  id: 701, slug: 'catalogue-item', title: 'Catalogue item', description: 'A Tradly catalogue test', images: [],
  type: 'listings', order_type: 'listings', stock: 8, max_quantity: 4, sold: false, active: true,
  liked: false, likes: 0, in_cart: false, offer_percent: 0, offer_price: { amount: 25, formatted: '$25.00', currency: 'USD' },
  list_price: { amount: 25, formatted: '$25.00', currency: 'USD' }, goal_price: { amount: 0, formatted: '$0.00', currency: 'USD' },
  shipping_charges: { amount: 0, formatted: '$0.00' }, account: { name: 'Test Seller' }, rating_data: { rating_count: 0, rating_average: 0 },
  ...overrides,
})

test('buyer must choose a variant and adds that variant id to cart', async ({ app, browser, screen }) => {
  await signIn(browser)
  await browser.route('**/v1/users/token/refresh**', route => route.fulfill({ json: { status: true, data: { auth_key: 'catalogue-auth', refresh_key: 'catalogue-refresh' } } }))
  await browser.route('**/v1/listings/by_slug/catalogue-item**', route => route.fulfill({ json: { status: true, data: { listing: listing() } } }))
  await browser.route('**/v1/listings/701/variants**', route => route.fulfill({ json: { status: true, data: { variants: [
    { id: 801, title: 'Small', stock: 2, active: true, list_price: 20, offer_price: 20, variant_values: [] },
    { id: 802, title: 'Large', stock: 4, active: true, list_price: 25, offer_price: 25, variant_values: [] },
  ] } } }))
  let cartInput: any
  await browser.route('**/v1/cart', async route => {
    if (route.request.method.toUpperCase() === 'POST') {
      cartInput = JSON.parse(route.request.postData ?? '{}').cart
      return route.fulfill({ json: { status: true, data: { cart: { id: 1 }, cart_details: [] } } })
    }
    return route.fulfill({ json: { status: true, data: { cart: { id: 1 }, cart_details: [] } } })
  })

  await app.open('/listing/catalogue-item')
  await expect(screen.getByRole('heading', 'Catalogue item')).toBeVisible()
  await screen.getByRole('button', 'Add to cart').tap()
  await expect(screen.getByText('Choose an option first')).toBeVisible()
  await screen.getByRole('button', 'Small · $20.00 · 2 left').tap()
  await screen.getByRole('button', 'Add to cart').tap()
  await expect(screen.getByText('Added to cart')).toBeVisible()
  expect(cartInput).toMatchObject({ listing_id: 701, quantity: 1, variant_id: 801 })
})

test('buyer joins a membership listing when Tradly marks type but keeps order_type as listings', async ({ app, browser, screen }) => {
  await signIn(browser)
  await browser.route('**/v1/users/token/refresh**', route => route.fulfill({ json: { status: true, data: { auth_key: 'catalogue-auth', refresh_key: 'catalogue-refresh' } } }))
  await browser.route('**/v1/listings/by_slug/catalogue-item**', route => route.fulfill({ json: { status: true, data: { listing: listing({ type: 'membership', order_type: 'listings', title: 'Strength Program', metadata: { membership_duration_months: 3 } }) } } }))
  let membershipInput: any
  await browser.route('**/v1/memberships', async route => {
    membershipInput = JSON.parse(route.request.postData ?? '{}').membership
    await route.fulfill({ json: { status: true, data: { membership: membershipInput } } })
  })
  await browser.route('**/v1/cart', async route => {
    if (route.request.method.toUpperCase() === 'DELETE') return route.fulfill({ json: { status: true, data: {} } })
    if (route.request.method.toUpperCase() === 'POST') return route.fulfill({ json: { status: true, data: { cart: { id: 5 }, cart_details: [] } } })
    return route.fulfill({ json: { status: true, data: { cart: { id: 5 }, cart_details: [{ id: 1, quantity: 1, listing: { ...listing({ type: 'membership', order_type: 'listings' }) } }] } } })
  })
  let requestedShipping = false
  await browser.route('**/v1/tenants/shipping_methods**', async route => {
    requestedShipping = true
    await route.fulfill({ json: { status: true, data: { shipping_methods: [] } } })
  })
  await browser.route('**/v1/tenants/payment_methods**', route => route.fulfill({ json: { status: true, data: { payment_methods: [] } } }))
  await browser.route('**/v1/commissions**', route => route.fulfill({ json: { status: true, data: { commissions: [] } } }))

  await app.open('/listing/catalogue-item')
  await expect(screen.getByRole('heading', 'Strength Program')).toBeVisible()
  await screen.getByRole('button', 'Join now').tap()
  await expect(browser).toHaveURL('/checkout')
  expect(membershipInput).toMatchObject({ listing_id: 701, duration_months: 3 })
  expect(requestedShipping).toBe(false)
})

test('buyer can choose mix-and-match bundle items before adding bundle', async ({ app, browser, screen }) => {
  await signIn(browser)
  await browser.route('**/v1/users/token/refresh**', route => route.fulfill({ json: { status: true, data: { auth_key: 'catalogue-auth', refresh_key: 'catalogue-refresh' } } }))
  await browser.route('**/v1/listings/by_slug/catalogue-item**', route => route.fulfill({ json: { status: true, data: { listing: listing({ id: 702, type: 'bundle', metadata: { bundle_mode: 'mix_match', min_quantity: 1, max_quantity: 2 } }) } } }))
  await browser.route('**/v1/bundles/702/pool**', route => route.fulfill({ json: { status: true, data: { pool: [{ component_listing_id: 91, listing: { id: 91, title: 'Cup' } }, { component_listing_id: 92, listing: { id: 92, title: 'Plate' } }], min_quantity: 1, max_quantity: 2 } } }))
  let selectionInput: any
  await browser.route('**/v1/bundles/702/select**', async route => {
    selectionInput = JSON.parse(route.request.postData ?? '{}')
    await route.fulfill({ json: { status: true, data: { selection_id: 44, bundle_price: 25, selected_count: 1 } } })
  })
  await browser.route('**/v1/cart', async route => {
    if (route.request.method.toUpperCase() === 'POST') return route.fulfill({ json: { status: true, data: { cart: { id: 6 }, cart_details: [] } } })
    return route.fulfill({ json: { status: true, data: { cart: { id: 6 }, cart_details: [] } } })
  })

  await app.open('/listing/catalogue-item')
  await expect(screen.getByText('Choose bundle items (minimum 1)')).toBeVisible()
  await screen.getByLabel('Cup').tap()
  await screen.getByRole('button', 'Add to cart').tap()
  await expect(screen.getByText('Added to cart')).toBeVisible()
  expect(selectionInput).toMatchObject({ selected_listing_ids: [91], quantity: 1 })
})

test('seller creates a membership listing with its duration metadata', async ({ app, browser, screen }) => {
  await browser.addInitScript((prefix: string) => {
    localStorage.setItem(`${prefix}_user_profile`, JSON.stringify({ id: 'catalogue-seller', first_name: 'Test', last_name: 'Seller', email: 'seller@example.test' }))
    document.cookie = `${prefix}_login=true; path=/`
    document.cookie = `${prefix}_logged_in_user_id=catalogue-seller; path=/`
    document.cookie = `${prefix}_auth_key=catalogue-auth; path=/`
    document.cookie = `${prefix}_refresh_key=catalogue-refresh; path=/`
  }, AppConfig.domain)
  await browser.route('**/v1/users/token/refresh**', route => route.fulfill({ json: { status: true, data: { auth_key: 'catalogue-auth', refresh_key: 'catalogue-refresh' } } }))
  await browser.route('**/v1/accounts**', route => route.fulfill({ json: { status: true, data: { accounts: [{ id: 77, name: 'Test Shop' }] } } }))
  await browser.route('**/v1/categories**', route => route.fulfill({ json: { status: true, data: { categories: [{ id: 4, name: 'Programs' }] } } }))
  await browser.route('**/v1/attributes**', route => route.fulfill({ json: { status: true, data: { attributes: [] } } }))
  let submitted: any
  await browser.route('**/v1/listings**', async route => {
    if (route.request.method.toUpperCase() === 'POST') {
      submitted = JSON.parse(route.request.postData ?? '{}').listing
      return route.fulfill({ json: { status: true, data: { listing: { id: 9101, slug: 'strength-program' } } } })
    }
    return route.fulfill({ json: { status: true, data: { listings: [] } } })
  })
  await browser.route('**/v1/utils/S3signedUploadURL**', route => route.fulfill({ json: { status: true, data: { result: [{ signedUrl: 'https://upload.example.test/membership', fileUri: 'https://media.example.test/membership.jpg' }] } } }))
  await browser.route('https://upload.example.test/**', route => route.fulfill({ status: 200, body: '' }))

  await app.open('/sell')
  await screen.getByLabel('Title').fill('Strength Program')
  await screen.getByLabel('Description').fill('A twelve week guided training plan')
  await screen.getByLabel('Listing type').selectOption({ value: 'membership' })
  await screen.getByLabel('Membership duration').selectOption({ value: '3' })
  await screen.getByLabel('Category').selectOption({ value: '4' })
  await screen.getByLabel('Price').fill('89')
  await screen.getByLabel('Available quantity').fill('20')
  await screen.getByLabel('Photos').setInputFiles(new URL('./fixtures/listing-photo.svg', import.meta.url).pathname)
  await screen.getByRole('button', 'Publish listing').tap()
  await expect(browser).toHaveURL('/listing/strength-program')
  expect(submitted).toMatchObject({ type: 'membership', order_type: 'membership', metadata: { membership_duration_months: 3 }, list_price: 89, stock: 20 })
})

test('seller creates a fixed bundle with component quantity', async ({ app, browser, screen }) => {
  await browser.addInitScript((prefix: string) => {
    localStorage.setItem(`${prefix}_user_profile`, JSON.stringify({ id: 'catalogue-seller', first_name: 'Test', last_name: 'Seller', email: 'seller@example.test' }))
    document.cookie = `${prefix}_login=true; path=/`
    document.cookie = `${prefix}_logged_in_user_id=catalogue-seller; path=/`
    document.cookie = `${prefix}_auth_key=catalogue-auth; path=/`
    document.cookie = `${prefix}_refresh_key=catalogue-refresh; path=/`
  }, AppConfig.domain)
  await browser.route('**/v1/users/token/refresh**', route => route.fulfill({ json: { status: true, data: { auth_key: 'catalogue-auth', refresh_key: 'catalogue-refresh' } } }))
  await browser.route('**/v1/accounts**', route => route.fulfill({ json: { status: true, data: { accounts: [{ id: 77, name: 'Test Shop' }] } } }))
  await browser.route('**/v1/categories**', route => route.fulfill({ json: { status: true, data: { categories: [{ id: 4, name: 'Home goods' }] } } }))
  await browser.route('**/v1/attributes**', route => route.fulfill({ json: { status: true, data: { attributes: [] } } }))
  let listingPayload: any
  let componentPayload: any
  await browser.route('**/v1/listings**', async route => {
    if (route.request.method.toUpperCase() === 'POST') {
      listingPayload = JSON.parse(route.request.postData ?? '{}').listing
      return route.fulfill({ json: { status: true, data: { listing: { id: 9102, slug: 'coffee-set' } } } })
    }
    return route.fulfill({ json: { status: true, data: { listings: [{ id: 92, title: 'Coffee mug', type: 'listings', offer_price: { formatted: '$12' } }], page: 1, total_records: 1 } } })
  })
  await browser.route('**/v1/bundles/9102/items', async route => {
    componentPayload = JSON.parse(route.request.postData ?? '{}')
    await route.fulfill({ json: { status: true, data: {} } })
  })
  await browser.route('**/v1/utils/S3signedUploadURL**', route => route.fulfill({ json: { status: true, data: { result: [{ signedUrl: 'https://upload.example.test/bundle', fileUri: 'https://media.example.test/bundle.jpg' }] } } }))
  await browser.route('https://upload.example.test/**', route => route.fulfill({ status: 200, body: '' }))

  await app.open('/sell')
  await screen.getByLabel('Title').fill('Coffee set')
  await screen.getByLabel('Description').fill('A bundle of coffee essentials')
  await screen.getByLabel('Listing type').selectOption({ value: 'bundle' })
  await expect(screen.getByLabel('Include Coffee mug')).toBeVisible()
  await screen.getByLabel('Include Coffee mug').tap()
  await screen.getByLabel('Coffee mug quantity in bundle').fill('2')
  await screen.getByLabel('Category').selectOption({ value: '4' })
  await screen.getByLabel('Price').fill('20')
  await screen.getByLabel('Available quantity').fill('5')
  await screen.getByLabel('Photos').setInputFiles(new URL('./fixtures/listing-photo.svg', import.meta.url).pathname)
  await screen.getByRole('button', 'Publish listing').tap()
  await expect(browser).toHaveURL('/listing/coffee-set')
  expect(listingPayload).toMatchObject({ type: 'bundle', order_type: 'listings', metadata: { bundle_mode: 'fixed' } })
  expect(componentPayload).toMatchObject({ component_listing_id: 92, quantity: 2 })
})

test('seller creates per-option price and inventory variants for a product', async ({ app, browser, screen }) => {
  await browser.addInitScript((prefix: string) => {
    localStorage.setItem(`${prefix}_user_profile`, JSON.stringify({ id: 'catalogue-seller', first_name: 'Test', last_name: 'Seller', email: 'seller@example.test' }))
    document.cookie = `${prefix}_login=true; path=/`
    document.cookie = `${prefix}_logged_in_user_id=catalogue-seller; path=/`
    document.cookie = `${prefix}_auth_key=catalogue-auth; path=/`
    document.cookie = `${prefix}_refresh_key=catalogue-refresh; path=/`
  }, AppConfig.domain)
  await browser.route('**/v1/users/token/refresh**', route => route.fulfill({ json: { status: true, data: { auth_key: 'catalogue-auth', refresh_key: 'catalogue-refresh' } } }))
  await browser.route('**/v1/accounts**', route => route.fulfill({ json: { status: true, data: { accounts: [{ id: 77, name: 'Test Shop' }] } } }))
  await browser.route('**/v1/categories**', route => route.fulfill({ json: { status: true, data: { categories: [{ id: 4, name: 'Clothing' }] } } }))
  await browser.route('**/v1/attributes**', route => route.fulfill({ json: { status: true, data: { attributes: [] } } }))
  await browser.route('**/v1/variant_types**', route => route.fulfill({ json: { status: true, data: { variant_types: [{ id: 2, name: 'Size' }] } } }))
  await browser.route('**/v1/variant_types/2/values**', route => route.fulfill({ json: { status: true, data: { variant_type_values: [{ id: 3, name: 'Small' }, { id: 4, name: 'Large' }] } } }))
  await browser.route('**/v1/listings**', route => route.fulfill({ json: { status: true, data: { listing: { id: 9103, slug: 'sizeable-shirt' } } } }))
  const variants: any[] = []
  await browser.route('**/v1/listings/9103/variants', async route => {
    variants.push(JSON.parse(route.request.postData ?? '{}').variant)
    await route.fulfill({ json: { status: true, data: {} } })
  })
  await browser.route('**/v1/utils/S3signedUploadURL**', route => route.fulfill({ json: { status: true, data: { result: [{ signedUrl: 'https://upload.example.test/variant', fileUri: 'https://media.example.test/variant.jpg' }] } } }))
  await browser.route('https://upload.example.test/**', route => route.fulfill({ status: 200, body: '' }))

  await app.open('/sell')
  await screen.getByLabel('Title').fill('Sizeable shirt')
  await screen.getByLabel('Description').fill('A shirt with multiple sizes')
  await screen.getByLabel('Category').selectOption({ value: '4' })
  await screen.getByLabel('Price').fill('30')
  await screen.getByLabel('Available quantity').fill('15')
  await screen.getByLabel('Variant type').selectOption({ value: '2' })
  await screen.getByLabel('Small').tap()
  await screen.getByLabel('Small price').fill('28')
  await screen.getByLabel('Small stock').fill('4')
  await screen.getByLabel('Large').tap()
  await screen.getByLabel('Large price').fill('32')
  await screen.getByLabel('Large stock').fill('6')
  await screen.getByLabel('Photos').setInputFiles(new URL('./fixtures/listing-photo.svg', import.meta.url).pathname)
  await screen.getByRole('button', 'Publish listing').tap()
  await expect(browser).toHaveURL('/listing/sizeable-shirt')
  expect(variants).toHaveLength(2)
  expect(variants).toEqual(expect.arrayContaining([
    expect.objectContaining({ list_price: 28, stock: 4, variant_values: [{ variant_type_id: 2, variant_type_value_id: 3 }] }),
    expect.objectContaining({ list_price: 32, stock: 6, variant_values: [{ variant_type_id: 2, variant_type_value_id: 4 }] }),
  ]))
})

test('fixed bundle blocks purchase when Tradly reports an unavailable component', async ({ app, browser, screen }) => {
  await signIn(browser)
  await browser.route('**/v1/users/token/refresh**', route => route.fulfill({ json: { status: true, data: { auth_key: 'catalogue-auth', refresh_key: 'catalogue-refresh' } } }))
  await browser.route('**/v1/listings/by_slug/catalogue-item**', route => route.fulfill({ json: { status: true, data: { listing: listing({ id: 703, type: 'bundle', metadata: { bundle_mode: 'fixed' } }) } } }))
  await browser.route('**/v1/bundles/703/items', route => route.fulfill({ json: { status: true, data: { items: [{ component_listing_id: 92, quantity: 2, listing: { title: 'Coffee mug' } }], bundle_price: 20, component_total: 24, saving: 4 } } }))
  let stockRequest = false
  let cartRequest = false
  await browser.route('**/v1/bundles/703/stock**', async route => {
    stockRequest = true
    await route.fulfill({ json: { status: true, data: { ok: false, out_of_stock: [{ listing_id: 92 }] } } })
  })
  await browser.route('**/v1/cart', async route => {
    if (route.request.method.toUpperCase() === 'POST') cartRequest = true
    await route.fulfill({ json: { status: true, data: { cart: { id: 8 }, cart_details: [] } } })
  })

  await app.open('/listing/catalogue-item')
  await expect(screen.getByText('Coffee mug × 2')).toBeVisible()
  await screen.getByRole('button', 'Add to cart').tap()
  await expect(screen.getByText('Some bundle items are out of stock')).toBeVisible()
  expect(stockRequest).toBe(true)
  expect(cartRequest).toBe(false)
})
