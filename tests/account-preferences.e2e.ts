import { test } from '@e2e-dev/web'
import { expect } from 'e2e'
import { AppConfig } from '../config/app.config.ts'

const signIn = async (browser: any) => {
  await browser.addInitScript((prefix: string) => {
    localStorage.setItem(`${prefix}_user_profile`, JSON.stringify({ id: 'pref-buyer', first_name: 'Pat', last_name: 'Buyer', email: 'pat@example.test' }))
    document.cookie = `${prefix}_login=true; path=/`
    document.cookie = `${prefix}_logged_in_user_id=pref-buyer; path=/`
    document.cookie = `${prefix}_auth_key=pref-auth; path=/`
    document.cookie = `${prefix}_refresh_key=pref-refresh; path=/`
  }, AppConfig.domain)
}

const tenantShell = (browser: any) => {
  browser.route('**/v1/users/token/refresh**', route => route.fulfill({ json: { status: true, data: { auth_key: 'pref-auth', refresh_key: 'pref-refresh' } } }))
  browser.route('**/v1/categories**', route => route.fulfill({ json: { status: true, data: { categories: [] } } }))
}

test('account preferences load tenant choices and persist selected language, currency, and country', async ({ app, browser, screen }) => {
  await signIn(browser)
  tenantShell(browser)
  await browser.route('**/v1/tenants/languages**', route => route.fulfill({ json: { status: true, data: { languages: [{ code: 'en', name: 'English' }, { code: 'fr', name: 'French' }] } } }))
  await browser.route('**/v1/currencies**', route => route.fulfill({ json: { status: true, data: { currencies: [{ id: 1, code: 'USD', name: 'US Dollar' }, { id: 2, code: 'EUR', name: 'Euro' }] } } }))
  await browser.route('**/v1/tenants/countries**', route => route.fulfill({ json: { status: true, data: { countries: [{ id: 1, name: 'United States', code: 'USA' }, { id: 33, name: 'France', code: 'FRA' }] } } }))

  await app.open('/account')
  await expect(screen.getByRole('heading', 'Store preferences')).toBeVisible()
  await screen.getByLabel('Default country or region').selectOption({ value: '33' })
  await expect(screen.getByLabel('Default country or region')).toHaveValue('33')
  await screen.getByLabel('Data language').selectOption({ value: 'fr' })
  await expect(screen.getByLabel('Data language')).toHaveValue('fr')
  await screen.getByLabel('Currency').selectOption({ value: 'EUR' })
  await expect(screen.getByLabel('Currency')).toHaveValue('EUR')
})

test('buyer can view and remove a saved listing', async ({ app, browser, screen }) => {
  await signIn(browser)
  tenantShell(browser)
  let saved = true
  await browser.route('**/v1/listings/likes**', route => route.fulfill({ json: { status: true, data: { listings: saved ? [{
    id: 901, slug: 'saved-camera', title: 'Saved camera', images: [], order_type: 'listings',
    offer_price: { formatted: '$18.00' }, account: { name: 'Camera shop' },
  }] : [] } } }))
  await browser.route('**/app/v1/listings/901/likes', async route => {
    if (route.request.method.toUpperCase() === 'DELETE') saved = false
    await route.fulfill({ json: { status: true, data: {} } })
  })
  await app.open('/saved-listings')
  await expect(screen.getByRole('heading', 'Saved listings')).toBeVisible()
  await expect(screen.getByRole('link', 'Saved camera')).toBeVisible()
  await screen.getByRole('button', 'Remove from saved listings: Saved camera').tap()
  await expect(screen.getByText('You have no saved listings yet.')).toBeVisible()
})

test('seller can edit and activate or deactivate a seller account', async ({ app, browser, screen }) => {
  await signIn(browser)
  tenantShell(browser)
  let name = 'Original shop'
  let active = true
  await browser.route('**/v1/accounts?**', route => route.fulfill({ json: { status: true, data: { accounts: [{ id: 77, name, description: 'Original description', active, category_id: [] }] } } }))
  let updateBody: any
  let patchBody: any
  await browser.route('**/v1/accounts/77', async route => {
    if (route.request.method.toUpperCase() === 'PUT') {
      updateBody = JSON.parse(route.request.postData ?? '{}').account
      name = updateBody.name
      return route.fulfill({ json: { status: true, data: { account: { id: 77, ...updateBody, active } } } })
    }
    if (route.request.method.toUpperCase() === 'PATCH') {
      patchBody = JSON.parse(route.request.postData ?? '{}')
      active = patchBody.active
      return route.fulfill({ json: { status: true, data: {} } })
    }
    return route.fulfill({ json: { status: true, data: { account: { id: 77, name, active } } } })
  })

  await app.open('/seller/accounts')
  await expect(screen.getByRole('heading', 'Seller accounts')).toBeVisible()
  await screen.getByLabel('Shop name').fill('Updated shop')
  await screen.getByRole('button', 'Save').tap()
  await expect(screen.getByText('Seller account updated.')).toBeVisible()
  expect(updateBody).toMatchObject({ name: 'Updated shop' })
  await screen.getByRole('button', 'Deactivate shop').tap()
  await expect(screen.getByText('Inactive')).toBeVisible()
  expect(patchBody).toEqual({ active: false })
  await screen.getByRole('button', 'Reactivate shop').tap()
  await expect(screen.getByText('Active')).toBeVisible()
  expect(patchBody).toEqual({ active: true })
})

test('buyer can block and unblock a seller from listing detail', async ({ app, browser, screen }) => {
  await signIn(browser)
  tenantShell(browser)
  await browser.route('**/v1/listings/by_slug/blockable-item**', route => route.fulfill({ json: { status: true, data: { listing: {
    id: 902, slug: 'blockable-item', title: 'Blockable item', description: '', images: [], type: 'listings', order_type: 'listings', stock: 5, max_quantity: 3, sold: false, active: true,
    liked: false, likes: 0, in_cart: false, offer_percent: 0, offer_price: { amount: 12, formatted: '$12.00', currency: 'USD' }, list_price: { amount: 12, formatted: '$12.00', currency: 'USD' }, goal_price: { amount: 0, formatted: '$0.00', currency: 'USD' }, shipping_charges: { amount: 0, formatted: '$0.00' },
    account: { id: 99, name: 'Seller shop', user: { id: 'seller-99' }, following: false }, rating_data: { rating_count: 0, rating_average: 0 }, attributes: [], categories: [], variants: [], metadata: {},
  } } } }))
  await browser.route('**/v1/listings/902/variants**', route => route.fulfill({ json: { status: true, data: { variants: [] } } }))
  await browser.route('**/v1/accounts/99', route => route.fulfill({ json: { status: true, data: { account: { id: 99, following: false } } } }))
  let blocked = false
  await browser.route('**/v1/accounts/feeds/blocked**', route => route.fulfill({ json: { status: true, data: { accounts: blocked ? [{ id: 99, name: 'Seller shop' }] : [] } } }))
  await browser.route('**/v1/accounts/99/block', async route => {
    blocked = route.request.method.toUpperCase() === 'POST'
    await route.fulfill({ json: { status: true, data: {} } })
  })

  await app.open('/l/blockable-item')
  await expect(screen.getByRole('button', 'Block seller')).toBeVisible()
  await screen.getByRole('button', 'Block seller').tap()
  await expect(screen.getByRole('button', 'Unblock seller')).toBeVisible()
  await screen.getByRole('button', 'Unblock seller').tap()
  await expect(screen.getByRole('button', 'Block seller')).toBeVisible()
})
