import { test } from '@e2e-dev/web'
import { expect } from 'e2e'
import { AppConfig } from '../config/app.config.ts'

test('visitor can open and submit a Tradly form using its returned attribute IDs', async ({ app, browser, screen }) => {
  await browser.route('**/v1/forms?**', route => route.fulfill({ json: { status: true, data: { forms: [{ id: 42, slug: 'contact', title: 'Contact us', description: 'Send a note' }] } } }))
  await browser.route('**/v1/forms/contact', route => route.fulfill({ json: { status: true, data: { form: { id: 42, title: 'Contact us', attributes: [{ attribute_id: 9, name: 'Your message', field_type: 'text', required: true }] } } } }))
  let submitted: any
  await browser.route('**/v1/forms/42/submissions', async route => {
    submitted = JSON.parse(route.request.postData ?? '{}')
    await route.fulfill({ json: { status: true, data: { submission: { id: 501 } } } })
  })
  await app.open('/forms')
  await screen.getByRole('link', 'Contact us Send a note').tap()
  await expect(browser).toHaveURL('/forms/contact')
  await screen.getByLabel('Your message').fill('Please contact me')
  await screen.getByRole('button', 'Submit').tap()
  await expect(screen.getByText('Your response was submitted.')).toBeVisible()
  expect(submitted).toEqual({ attribute_values: [{ attribute_id: 9, values: 'Please contact me' }] })
})

test('homepage renders Tradly feeds, tags, collections and promotions', async ({ app, browser, screen }) => {
  await browser.route('**/v1/listings?**', route => route.fulfill({ json: { status: true, data: { listings: [], total_records: 0 } } }))
  await browser.route('**/v1/home?**', route => route.fulfill({ json: { status: true, data: { listings: [{ id: 51, slug: 'community-pick', title: 'Community pick', type: 'listings', order_type: 'listings' }] } } }))
  await browser.route('**/v1/activities?**', route => route.fulfill({ json: { status: true, data: { activities: [] } } }))
  await browser.route('**/v1/tags/search**', route => route.fulfill({ json: { status: true, data: { tags: [{ id: 1, name: 'fitness' }] } } }))
  await browser.route('**/v1/collections**', route => route.fulfill({ json: { status: true, data: { collections: [{ id: 61, title: 'Staff picks', description: 'Selected products' }] } } }))
  await browser.route('**/v1/promos?**', route => route.fulfill({ json: { status: true, data: { promos: [{ id: 71, title: 'Autumn offers' }] } } }))

  await app.open('/')
  await expect(screen.getByRole('heading', 'Marketplace activity')).toBeVisible()
  await expect(screen.getByRole('link', 'Community pick')).toBeVisible()
  await expect(screen.getByRole('heading', 'Explore tags')).toBeVisible()
  await expect(screen.getByRole('heading', 'Collections')).toBeVisible()
  await expect(screen.getByRole('heading', 'Featured promotions')).toBeVisible()
  await expect(screen.getByRole('link', 'Explore donation campaigns')).not.toBeVisible()
  await screen.getByRole('button', '#fitness').tap()
  await expect(screen.getByPlaceholder('Search listings…')).toHaveValue('fitness')
})

test('signed-in visitor can follow a listing seller and post a listing comment', async ({ app, browser, screen }) => {
  await browser.addInitScript((prefix: string) => {
    localStorage.setItem(`${prefix}_user_profile`, JSON.stringify({ id: 'buyer-1', first_name: 'Buyer', last_name: 'One', email: 'buyer@example.test' }))
    document.cookie = `${prefix}_login=true; path=/`
    document.cookie = `${prefix}_logged_in_user_id=buyer-1; path=/`
    document.cookie = `${prefix}_auth_key=buyer-auth; path=/`
    document.cookie = `${prefix}_refresh_key=buyer-refresh; path=/`
  }, AppConfig.domain)
  await browser.route('**/v1/users/token/refresh**', route => route.fulfill({ json: { status: true, data: { auth_key: 'buyer-auth', refresh_key: 'buyer-refresh' } } }))
  await browser.route('**/v1/listings**', route => route.fulfill({ json: { status: true, data: { listings: [], total_records: 0 } } }))
  await browser.route('**/v1/listings/by_slug/visitor-item**', route => route.fulfill({ json: { status: true, data: { listing: {
    id: 701, slug: 'visitor-item', title: 'Visitor item', description: 'A test listing', images: [], type: 'listings', order_type: 'listings', stock: 4, max_quantity: 2, sold: false, active: true,
    liked: false, likes: 0, in_cart: false, offer_percent: 0, offer_price: { amount: 10, formatted: '$10.00' }, list_price: { amount: 10, formatted: '$10.00' }, goal_price: { amount: 0, formatted: '$0.00' }, shipping_charges: { amount: 0, formatted: '$0.00' },
    account: { id: 99, name: 'Test seller', following: false, images: [], total_listings: 1 }, rating_data: { rating_count: 0, rating_average: 0 }, attributes: [], categories: [], variants: [], metadata: {},
  } } } }))
  await browser.route('**/v1/listings/701/variants**', route => route.fulfill({ json: { status: true, data: { variants: [] } } }))
  await browser.route('**/v1/reviews?**', route => route.fulfill({ json: { status: true, data: { reviews: [] } } }))
  await browser.route('**/v1/accounts/99', route => route.fulfill({ json: { status: true, data: { account: { id: 99, following: false } } } }))
  let followCalled = false
  await browser.route('**/v1/accounts/99/follow', async route => { followCalled = route.request.method.toUpperCase() === 'POST'; await route.fulfill({ json: { status: true, data: {} } }) })
  let commentInput: any
  await browser.route('**/v1/comments?**', route => route.fulfill({ json: { status: true, data: { comments: [] } } }))
  await browser.route('**/v1/comments', async route => {
    if (route.request.method.toUpperCase() === 'POST') commentInput = JSON.parse(route.request.postData ?? '{}')
    await route.fulfill({ json: { status: true, data: {} } })
  })

  await app.open('/l/visitor-item')
  await screen.getByRole('button', 'Follow seller').tap()
  await screen.getByLabel('Add a comment').fill('Is this still available?')
  await screen.getByRole('button', 'Post comment').tap()
  await expect(screen.getByRole('heading', 'Comments')).toBeVisible()
  expect(followCalled).toBe(true)
  expect(commentInput).toEqual({ comment: { reference_id: 701, reference_type: 'listings_comments', message: 'Is this still available?' } })
})

test('seller can edit variant stock and remove a fixed bundle component', async ({ app, browser, screen }) => {
  await browser.addInitScript((prefix: string) => {
    localStorage.setItem(`${prefix}_user_profile`, JSON.stringify({ id: 'seller-1', first_name: 'Seller', last_name: 'One', email: 'seller@example.test' }))
    document.cookie = `${prefix}_login=true; path=/`
    document.cookie = `${prefix}_logged_in_user_id=seller-1; path=/`
    document.cookie = `${prefix}_auth_key=seller-auth; path=/`
    document.cookie = `${prefix}_refresh_key=seller-refresh; path=/`
  }, AppConfig.domain)
  await browser.route('**/v1/users/token/refresh**', route => route.fulfill({ json: { status: true, data: { auth_key: 'seller-auth', refresh_key: 'seller-refresh' } } }))
  await browser.route('**/v1/accounts**', route => route.fulfill({ json: { status: true, data: { accounts: [{ id: 77, name: 'Seller shop' }] } } }))
  await browser.route('**/v1/listings**', route => route.fulfill({ json: { status: true, data: { page: 1, listings: [
    { id: 701, slug: 'bundle', title: 'Fixed bundle', type: 'bundle', order_type: 'listings', status: 2, images: [], metadata: { bundle_mode: 'fixed' }, variants: [] },
    { id: 702, slug: 'product', title: 'Product with options', type: 'listings', order_type: 'listings', status: 2, images: [], variants: [{ id: 801 }] },
  ], total_records: 2 } } }))
  await browser.route('**/v1/bundles/701/items**', async route => {
    if (route.request.method.toUpperCase() === 'DELETE') return route.fulfill({ json: { status: true, data: {} } })
    return route.fulfill({ json: { status: true, data: { items: [{ id: 711, component_listing_id: 91, quantity: 1, order_by: 0, component_listing: { id: 91, title: 'Water bottle' } }] } } })
  })
  await browser.route('**/v1/listings/702/variants**', async route => {
    if (route.request.method.toUpperCase() === 'PUT') return route.fulfill({ json: { status: true, data: {} } })
    return route.fulfill({ json: { status: true, data: { variants: [{ id: 801, title: 'Small', list_price: 12, stock: 5, active: true, variant_values: [] }] } } })
  })

  await app.open('/manage-listings')
  await screen.getByLabel('Stock').fill('3')
  await screen.getByRole('button', 'Save').nth(1).tap()
  await expect(screen.getByText('Changes saved.')).toBeVisible()
  const off = await browser.onDialog('accept')
  await screen.getByRole('button', 'Remove').nth(0).tap()
  await off()
  await expect(screen.getByText('Bundle item removed.')).toBeVisible()
})

test('seller can edit a rental room variant price and inventory', async ({ app, browser, screen }) => {
  await browser.addInitScript((prefix: string) => {
    localStorage.setItem(`${prefix}_user_profile`, JSON.stringify({ id: 'rental-seller', first_name: 'Rental', last_name: 'Seller', email: 'rental@example.test' }))
    document.cookie = `${prefix}_login=true; path=/`
    document.cookie = `${prefix}_logged_in_user_id=rental-seller; path=/`
    document.cookie = `${prefix}_auth_key=rental-auth; path=/`
    document.cookie = `${prefix}_refresh_key=rental-refresh; path=/`
  }, AppConfig.domain)
  await browser.route('**/v1/users/token/refresh**', route => route.fulfill({ json: { status: true, data: { auth_key: 'rental-auth', refresh_key: 'rental-refresh' } } }))
  await browser.route('**/v1/accounts**', route => route.fulfill({ json: { status: true, data: { accounts: [{ id: 77, name: 'Rental seller' }] } } }))
  await browser.route('**/v1/listings**', route => route.fulfill({ json: { status: true, data: { page: 1, total_records: 1, listings: [
    { id: 703, slug: 'rental-room', title: 'Hotel room', type: 'rental', order_type: 'rental', status: 2, images: [], variants: [{ id: 803 }] },
  ] } } }))
  await browser.route('**/v1/listings/703/variants', route => route.fulfill({ json: { status: true, data: { variants: [{ id: 803, title: 'Deluxe room', list_price: 150, stock: 5, active: true, variant_values: [] }] } } }))
  let updated: any
  await browser.route('**/v1/listings/703/variants/803', async route => {
    if (route.request.method.toUpperCase() === 'PUT') updated = JSON.parse(route.request.postData ?? '{}')
    await route.fulfill({ json: { status: true, data: { variant: { id: 803, title: 'Deluxe room', list_price: 180, stock: 3, active: true, variant_values: [] } } } })
  })

  await app.open('/manage-listings')
  await screen.getByLabel('Price').fill('180')
  await screen.getByLabel('Stock').fill('3')
  await screen.getByRole('button', 'Save').tap()
  await expect(screen.getByText('Changes saved.')).toBeVisible()
  expect(updated).toEqual({ variant: { list_price: 180, stock: 3 } })
})
