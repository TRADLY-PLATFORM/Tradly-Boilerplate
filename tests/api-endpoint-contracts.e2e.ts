import { createRequire } from 'node:module'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { test } from '@e2e-dev/web'
import { expect } from 'e2e'
import TradlySDK from 'tradly'

import * as addresses from '../api/addresses.ts'
import * as accounts from '../api/accounts.ts'
import * as attributes from '../api/attributes.ts'
import * as bundles from '../api/bundles.ts'
import * as auth from '../api/auth.ts'
import * as cart from '../api/cart.ts'
import * as categories from '../api/categories.ts'
import * as checkout from '../api/checkout.ts'
import * as commissions from '../api/commissions.ts'
import * as listing from '../api/listing.ts'
import * as memberships from '../api/memberships.ts'
import * as orders from '../api/orders.ts'
import * as paymentMethods from '../api/payment-methods.ts'
import * as schedules from '../api/schedules.ts'
import * as shippingMethods from '../api/shipping-methods.ts'
import * as variants from '../api/variants.ts'
import { AppConfig } from '../config/app.config.ts'
import { getTradlyResponseError } from '../state/api-response.ts'
import { parseSignUpResponse } from '../state/auth/signup-response.ts'

type CapturedRequest = {
  method: string
  url: string
  data: unknown
}

type EndpointCase = {
  id: string
  method: string
  path: string
  invoke: () => Promise<unknown>
  expectedBody?: unknown
  expectedQuery?: Record<string, string>
}

const authKey = 'contract-auth-key'
const currency = 'USD'
const language = 'en'
const listingId = 101
const categoryId = 202
const orderId = 303
const shipmentId = 404
const shippingMethodId = 505
const addressId = 606
const cartId = 707

const endpoints: EndpointCase[] = [
  { id: 'accounts.getMyAccounts', method: 'get', path: '/v1/accounts', invoke: () => accounts.getMyAccounts('contract-user', authKey, currency, language) },
  { id: 'accounts.createAccount', method: 'post', path: '/v1/accounts', invoke: () => accounts.createAccount({ name: 'Contract Shop', type: 'accounts' }, authKey, currency, language) },
  { id: 'attributes.getAttributes', method: 'get', path: '/v1/attributes', invoke: () => attributes.getAttributes({ type: 'listings', category_id: categoryId }, authKey, currency, language) },

  { id: 'bundles.getBundleItems', method: 'get', path: `/v1/bundles/${listingId}/items`, invoke: () => bundles.getBundleItems(listingId, authKey, currency, language) },
  { id: 'bundles.addBundleItem', method: 'post', path: `/v1/bundles/${listingId}/items`, invoke: () => bundles.addBundleItem(listingId, { component_listing_id: 202, quantity: 1 }, authKey, currency, language), expectedBody: { component_listing_id: 202, quantity: 1 } },
  { id: 'bundles.getBundleStock', method: 'get', path: `/v1/bundles/${listingId}/stock`, invoke: () => bundles.getBundleStock(listingId, 2, authKey, currency, language), expectedQuery: { quantity: '2' } },
  { id: 'bundles.getBundlePool', method: 'get', path: `/v1/bundles/${listingId}/pool`, invoke: () => bundles.getBundlePool(listingId, authKey, currency, language) },
  { id: 'bundles.addBundlePoolItem', method: 'post', path: `/v1/bundles/${listingId}/pool`, invoke: () => bundles.addBundlePoolItem(listingId, { component_listing_id: 202 }, authKey, currency, language), expectedBody: { component_listing_id: 202 } },
  { id: 'bundles.submitBundleSelection', method: 'post', path: `/v1/bundles/${listingId}/select`, invoke: () => bundles.submitBundleSelection(listingId, { selected_listing_ids: [202], quantity: 1 }, authKey, currency, language), expectedBody: { selected_listing_ids: [202], quantity: 1 } },
  { id: 'bundles.getBundleSelection', method: 'get', path: `/v1/bundles/${listingId}/selections/1`, invoke: () => bundles.getBundleSelection(listingId, 1, authKey, currency, language) },
  { id: 'addresses.getAddresses', method: 'get', path: '/v1/addresses', invoke: () => addresses.getAddresses(authKey, currency, language) },
  { id: 'addresses.addAddress', method: 'post', path: '/v1/addresses', invoke: () => addresses.addAddress({ first_name: 'Test', last_name: 'Buyer' } as never, authKey, currency, language) },
  { id: 'addresses.deleteAddress', method: 'delete', path: `/v1/addresses/${addressId}`, invoke: () => addresses.deleteAddress(addressId, authKey, currency, language) },
  { id: 'addresses.getStorageHubAddresses', method: 'get', path: '/v1/addresses', invoke: () => addresses.getStorageHubAddresses(authKey, currency, language) },

  { id: 'auth.signIn', method: 'post', path: '/v1/users/login', invoke: () => auth.signIn({ email: 'contract@example.invalid', password: 'invalid', type: 'customer' }, currency, language) },
  { id: 'auth.signUp', method: 'post', path: '/v1/users/register', invoke: () => auth.signUp({ first_name: 'Test', last_name: 'Buyer', email: 'not-an-email', password: 'invalid', type: 'customer' }, currency, language) },
  { id: 'auth.verifyOtp', method: 'post', path: '/v1/users/verify', invoke: () => auth.verifyOtp({ verify_id: 'contract-verification', code: '000000' }, currency, language) },
  { id: 'auth.forgotPassword', method: 'post', path: '/v1/users/password/recovery', invoke: () => auth.forgotPassword({ email: 'contract@example.invalid' }, currency, language) },
  { id: 'auth.setPassword', method: 'post', path: '/v1/users/password/set', invoke: () => auth.setPassword({ verify_id: 'contract-verification', code: '000000', password: 'invalid' }, currency, language) },
  { id: 'auth.resendOtp', method: 'post', path: '/v1/users/register', invoke: () => auth.resendOtp({ first_name: 'Test', last_name: 'Buyer', email: 'not-an-email', password: 'invalid', type: 'customer' }, currency, language) },
  { id: 'auth.socialSignIn', method: 'post', path: '/v1/users/social_login', invoke: () => auth.socialSignIn({ provider: 'google', token: 'invalid', platform: 'web', type: 'customer' }, currency, language) },
  { id: 'auth.signOut', method: 'post', path: '/v1/users/logout', invoke: () => auth.signOut(authKey, currency, language) },
  { id: 'auth.refreshAuth', method: 'get', path: '/v1/users/token/refresh', invoke: () => auth.refreshAuth('contract-refresh-key') },

  { id: 'cart.getCart', method: 'get', path: '/v1/cart', invoke: () => cart.getCart(authKey, currency, language) },
  { id: 'cart.addToCart', method: 'post', path: '/v1/cart', invoke: () => cart.addToCart({ listing_id: 0, quantity: 0 }, authKey, currency, language) },
  { id: 'cart.deleteCartItem', method: 'patch', path: '/v1/cart', invoke: () => cart.deleteCartItem(listingId, authKey, currency, language) },
  { id: 'cart.clearCart', method: 'delete', path: '/v1/cart', invoke: () => cart.clearCart(authKey, currency, language) },
  { id: 'cart.applyCouponToCart', method: 'post', path: '/v1/cart/coupon', invoke: () => cart.applyCouponToCart(cartId, 'CONTRACT', authKey, currency, language) },
  { id: 'cart.removeCouponFromCart', method: 'delete', path: '/v1/cart/coupon', invoke: () => cart.removeCouponFromCart(cartId, authKey, currency, language) },
  { id: 'cart.getCartWithCommissions', method: 'get', path: '/v1/cart', invoke: () => cart.getCartWithCommissions([{ id: 1, amount: 1 }], authKey, currency, language) },
  { id: 'cart.getCartWithShipping', method: 'get', path: '/v1/cart', invoke: () => cart.getCartWithShipping(shippingMethodId, authKey, currency, language) },

  { id: 'categories.getCategories', method: 'get', path: '/v1/categories', invoke: () => categories.getCategories({}, authKey, currency, language) },
  { id: 'categories.getCategoryBySlug', method: 'get', path: '/v1/categories/by_slug/contract-category', invoke: () => categories.getCategoryBySlug('contract-category', authKey, currency, language) },
  { id: 'categories.getCategoryById', method: 'get', path: `/v1/categories/${categoryId}`, invoke: () => categories.getCategoryById(categoryId, authKey, currency, language) },
  { id: 'categories.getCategoryListings', method: 'get', path: '/v1/listings', invoke: () => categories.getCategoryListings({ category_id: categoryId }, authKey, currency, language) },

  { id: 'checkout.checkout', method: 'post', path: '/v1/cart/checkout', invoke: () => checkout.checkout({ order: {} } as never, authKey, currency, language) },
  { id: 'checkout.getPaymentIntent', method: 'post', path: '/v1/payments/stripe/paymentIntent', invoke: () => checkout.getPaymentIntent('contract-order', authKey, currency, language) },
  { id: 'checkout.getEphemeralKey', method: 'post', path: '/v1/payments/stripe/ephemeralKey', invoke: () => checkout.getEphemeralKey(authKey, currency, language) },
  { id: 'checkout.directCheckout', method: 'post', path: `/v1/listings/${listingId}/checkout`, invoke: () => checkout.directCheckout(listingId, {} as never, authKey, currency, language) },

  { id: 'commissions.getCommissions', method: 'get', path: '/v1/commissions', invoke: () => commissions.getCommissions({ type: 'cart' }, authKey, currency, language) },

  { id: 'listing.getListings', method: 'get', path: '/v1/listings', invoke: () => listing.getListings({}, authKey, currency, language) },
  { id: 'listing.createListing', method: 'post', path: '/v1/listings', invoke: () => listing.createListing({ title: 'Contract listing', account_id: 1, attributes: [{ id: 9, values: ['1'] }] }, authKey, currency, language) },
  { id: 'listing.getListingDetail', method: 'get', path: '/v1/listings/by_slug/contract-listing', invoke: () => listing.getListingDetail('contract-listing', false, authKey, currency, language) },
  { id: 'listing.likeListing', method: 'post', path: `/v1/listings/${listingId}/likes`, invoke: () => listing.likeListing(listingId, authKey, currency, language) },
  { id: 'listing.unlikeListing', method: 'delete', path: `/v1/listings/${listingId}/unlikes`, invoke: () => listing.unlikeListing(listingId, authKey, currency, language) },

  { id: 'memberships.createMembership', method: 'post', path: '/v1/memberships', invoke: () => memberships.createMembership({ listing_id: listingId, membership_id: 'contract-member' }, authKey, currency, language), expectedBody: { membership: { listing_id: listingId, membership_id: 'contract-member' } } },
  { id: 'memberships.getMemberships', method: 'get', path: '/v1/memberships', invoke: () => memberships.getMemberships({ listing_id: listingId }, authKey, currency, language), expectedQuery: { listing_id: String(listingId) } },

  { id: 'variants.getVariantTypes', method: 'get', path: '/v1/variant_types', invoke: () => variants.getVariantTypes(authKey, currency, language) },
  { id: 'variants.getVariantTypeValues', method: 'get', path: '/v1/variant_types/2/values', invoke: () => variants.getVariantTypeValues(2, authKey, currency, language) },
  { id: 'variants.getListingVariants', method: 'get', path: `/v1/listings/${listingId}/variants`, invoke: () => variants.getListingVariants(listingId, authKey, currency, language) },
  { id: 'variants.createListingVariant', method: 'post', path: `/v1/listings/${listingId}/variants`, invoke: () => variants.createListingVariant(listingId, { title: 'Small', list_price: 10, stock: 5, active: true, variant_values: [{ variant_type_id: 2, variant_type_value_id: 3 }] }, authKey, currency, language), expectedBody: { variant: { title: 'Small', list_price: 10, stock: 5, active: true, variant_values: [{ variant_type_id: 2, variant_type_value_id: 3 }] } } },
  { id: 'variants.deleteListingVariant', method: 'delete', path: `/v1/listings/${listingId}/variants/3`, invoke: () => variants.deleteListingVariant(listingId, 3, authKey, currency, language) },

  { id: 'orders.getOrders', method: 'get', path: '/v1/orders', invoke: () => orders.getOrders({}, authKey, currency, language) },
  { id: 'orders.getOrderDetail', method: 'get', path: `/v1/orders/${orderId}`, invoke: () => orders.getOrderDetail(orderId, authKey, currency, language) },
  { id: 'orders.updateOrderStatus', method: 'patch', path: `/v1/orders/${orderId}/status`, invoke: () => orders.updateOrderStatus({ id: orderId, status: 'pending' } as never, authKey, currency, language) },
  { id: 'orders.updateShipmentStatus', method: 'patch', path: `/v1/orders/${orderId}/shipments/${shipmentId}/status`, invoke: () => orders.updateShipmentStatus({ order_id: orderId, shipment_id: shipmentId, status: 'pending' } as never, authKey, currency, language) },
  { id: 'orders.verifyOrderDetails', method: 'post', path: '/v1/orders/order_detail_item_attributes/validate', invoke: () => orders.verifyOrderDetails({ id: orderId } as never, authKey, currency, language) },

  { id: 'paymentMethods.getPaymentMethods', method: 'get', path: '/v1/tenants/payment_methods', invoke: () => paymentMethods.getPaymentMethods(authKey, currency, language) },

  { id: 'schedules.getSchedules', method: 'get', path: `/v1/listings/${listingId}/schedules_per_day`, invoke: () => schedules.getSchedules(listingId, '2026-10-05', 30, authKey, currency, language) },
  { id: 'schedules.createSchedule', method: 'put', path: `/v1/listings/${listingId}/schedules`, invoke: () => schedules.createSchedule(listingId, [{ start_date: '2026-11-01', end_date: '2026-11-30', start_time: '09:00', end_time: '17:00', schedule_type: 1, active: true, total_stocks: 4 }], authKey, currency, language) },

  { id: 'shippingMethods.getShippingMethods', method: 'get', path: '/v1/tenants/shipping_methods', invoke: () => shippingMethods.getShippingMethods({ type: 'tenant' }, authKey, currency, language) },
  { id: 'shippingMethods.getSendCloudShipmentMethods', method: 'get', path: '/v1/shipments/sendcloud/shipping_methods', invoke: () => shippingMethods.getSendCloudShipmentMethods({ shipping_method_id: shippingMethodId, country: 'US' }, authKey, currency, language) },
  { id: 'shippingMethods.getExternalShipmentMethods', method: 'get', path: `/v1/tenants/shipping_methods/${shippingMethodId}/external`, invoke: () => shippingMethods.getExternalShipmentMethods({ shipping_method_id: shippingMethodId, shipping_address_id: addressId }, authKey, currency, language) },
]

const nonEndpointExports = new Set([
  'buildSdkPayload',
  'buildAppQueryPayload',
  'buildAppMutationPayload',
  'buildAppDirectPayload',
  'PAYMENT_INTENT_TYPES',
  'buildPaymentIntentUrl',
  'EXTERNAL_CHECKOUT_TYPES',
  'buildExternalCheckoutUrl',
  'buildWebPaymentUrl',
  'uploadImages',
])

const stateEndpointToApiWrapper: Record<string, string> = {
  'accounts.getMyAccounts': 'accounts.getMyAccounts',
  'accounts.createAccount': 'accounts.createAccount',
  'attributes.getAttributes': 'attributes.getAttributes',
  'bundles.getBundleItems': 'bundles.getBundleItems',
  'bundles.addBundleItem': 'bundles.addBundleItem',
  'bundles.getBundleStock': 'bundles.getBundleStock',
  'bundles.getBundlePool': 'bundles.getBundlePool',
  'bundles.addBundlePoolItem': 'bundles.addBundlePoolItem',
  'bundles.submitBundleSelection': 'bundles.submitBundleSelection',
  'bundles.getBundleSelection': 'bundles.getBundleSelection',
  'addresses.getAddresses': 'addresses.getAddresses',
  'addresses.getStorageHubAddresses': 'addresses.getStorageHubAddresses',
  'addresses.addAddress': 'addresses.addAddress',
  'addresses.deleteAddress': 'addresses.deleteAddress',
  'auth.signIn': 'auth.signIn',
  'auth.signUp': 'auth.signUp',
  'auth.verifyOtp': 'auth.verifyOtp',
  'auth.forgotPassword': 'auth.forgotPassword',
  'auth.setPassword': 'auth.setPassword',
  'auth.resendOtp': 'auth.resendOtp',
  'auth.socialSignIn': 'auth.socialSignIn',
  'auth.refreshAuth': 'auth.refreshAuth',
  'cart.getCart': 'cart.getCart',
  'cart.addToCart': 'cart.addToCart',
  'cart.deleteCartItem': 'cart.deleteCartItem',
  'cart.clearCart': 'cart.clearCart',
  'cart.applyCoupon': 'cart.applyCouponToCart',
  'cart.removeCoupon': 'cart.removeCouponFromCart',
  'cart.getCartWithCommissions': 'cart.getCartWithCommissions',
  'cart.getCartWithShipping': 'cart.getCartWithShipping',
  'categories.getCategories': 'categories.getCategories',
  'categories.getCategoryBySlug': 'categories.getCategoryBySlug',
  'categories.getCategoryById': 'categories.getCategoryById',
  'categories.getCategoryListings': 'categories.getCategoryListings',
  'commissions.getCartCommissions': 'commissions.getCommissions',
  'commissions.getDemandCommissions': 'commissions.getCommissions',
  'listing.getListings': 'listing.getListings',
  'listing.createListing': 'listing.createListing',
  'listing.getListingDetail': 'listing.getListingDetail',
  'listing.likeListing': 'listing.likeListing',
  'listing.unlikeListing': 'listing.unlikeListing',
  'memberships.createMembership': 'memberships.createMembership',
  'memberships.getMemberships': 'memberships.getMemberships',
  'orders.checkout': 'checkout.checkout',
  'orders.paymentIntent': 'checkout.getPaymentIntent',
  'orders.directCheckout': 'checkout.directCheckout',
  'orders.getOrders': 'orders.getOrders',
  'orders.getOrderDetail': 'orders.getOrderDetail',
  'orders.updateOrderStatus': 'orders.updateOrderStatus',
  'orders.updateShipmentStatus': 'orders.updateShipmentStatus',
  'orders.verifyOrder': 'orders.verifyOrderDetails',
  'payment-methods.getPaymentMethods': 'paymentMethods.getPaymentMethods',
  'schedules.getSchedules': 'schedules.getSchedules',
  'schedules.createSchedule': 'schedules.createSchedule',
  'shipping-methods.getShippingMethods': 'shippingMethods.getShippingMethods',
  'shipping-methods.getSendCloudShipmentMethods': 'shippingMethods.getSendCloudShipmentMethods',
  'shipping-methods.getExternalShipmentMethods': 'shippingMethods.getExternalShipmentMethods',
  'variants.getVariantTypes': 'variants.getVariantTypes',
  'variants.getVariantTypeValues': 'variants.getVariantTypeValues',
  'variants.getListingVariants': 'variants.getListingVariants',
  'variants.createListingVariant': 'variants.createListingVariant',
  'variants.deleteListingVariant': 'variants.deleteListingVariant',
}

const discoverEndpointExports = (): string[] => {
  const apiDir = fileURLToPath(new URL('../api/', import.meta.url))
  return readdirSync(apiDir)
    .filter((file) => file.endsWith('.ts'))
    .flatMap((file) => {
      const source = readFileSync(new URL(`../api/${file}`, import.meta.url), 'utf8')
      const moduleName = file
        .replace(/\.ts$/, '')
        .replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase())
      return [...source.matchAll(/export const (\w+)\s*=/g)].map((match) => `${moduleName}.${match[1]}`)
    })
    .filter((name) => !nonEndpointExports.has(name.slice(name.indexOf('.') + 1)))
    .sort()
}

const discoverStateEndpoints = (): string[] => {
  const stateDir = fileURLToPath(new URL('../state/', import.meta.url))
  const files = readdirSync(stateDir)
  return files.flatMap((entry) => {
    const path = `${stateDir}/${entry}`
    if (statSync(path).isDirectory()) {
      return readdirSync(path)
        .filter((file) => file.endsWith('.ts'))
        .flatMap((file) => discoverStateApiFile(`${path}/${file}`, entry))
    }
    return entry.endsWith('.ts') ? discoverStateApiFile(path, entry.replace(/\.ts$/, '')) : []
  }).filter(name => name !== 'uploads.uploadImages').sort()
}

const discoverUnguardedStateEndpoints = (): string[] => {
  const stateDir = fileURLToPath(new URL('../state/', import.meta.url))
  const apiFiles: string[] = []
  const collectApiFiles = (directory: string) => {
    for (const entry of readdirSync(directory)) {
      const path = `${directory}/${entry}`
      if (statSync(path).isDirectory()) collectApiFiles(path)
      else if (entry.endsWith('.ts') && readFileSync(path, 'utf8').includes('builder.')) apiFiles.push(path)
    }
  }
  collectApiFiles(stateDir)

  return apiFiles.flatMap((path) => {
    const source = readFileSync(path, 'utf8')
    const endpoints = [...source.matchAll(/^\s*(\w+): builder\.(?:query|mutation)</gm)]
    return endpoints.flatMap((match, index) => {
      const start = match.index ?? 0
      const end = endpoints[index + 1]?.index ?? source.length
      const body = source.slice(start, end)
      const hasResponseGuard =
        body.includes('normalizeTradlyResponse') ||
        body.includes('parseSignUpResponse') ||
        body.includes('getTradlyResponseError') ||
        body.includes('getThrownErrorMessage')
      return hasResponseGuard ? [] : [`${path.split('/state/')[1]}:${match[1]}`]
    })
  }).sort()
}

const discoverStateApiFile = (path: string, moduleName: string): string[] => {
  const source = readFileSync(path, 'utf8')
  return [...source.matchAll(/^\s*(\w+): builder\.(?:query|mutation)</gm)]
    .map((match) => `${moduleName}.${match[1]}`)
}

const getTradlyAxios = async (): Promise<any> => {
  const requireFromTest = createRequire(import.meta.url)
  const tradlyEntry = requireFromTest.resolve('tradly')
  const axiosEntry = createRequire(tradlyEntry).resolve('axios')
  const axiosModule = await import(pathToFileURL(axiosEntry).href) as { default: any }
  return axiosModule.default
}

test('every exported Tradly API wrapper is covered and dispatches its expected SDK request', async () => {
  const covered = endpoints.map(({ id }) => id).sort()
  const discovered = discoverEndpointExports()
  expect(covered).toEqual(discovered)

  const discoveredStateEndpoints = discoverStateEndpoints()
  expect(Object.keys(stateEndpointToApiWrapper).sort()).toEqual(discoveredStateEndpoints)
  expect(discoverUnguardedStateEndpoints()).toEqual([])
  for (const wrapperId of Object.values(stateEndpointToApiWrapper)) {
    expect(discovered.includes(wrapperId)).toBe(true)
  }

  const axios = await getTradlyAxios()
  const originalAdapter = axios.defaults.adapter
  const requests: CapturedRequest[] = []

  axios.defaults.adapter = async (config: { method?: string; url?: string; data?: unknown }) => {
    requests.push({
      method: (config.method ?? 'get').toLowerCase(),
      url: config.url ?? '',
      data: config.data,
    })
    return {
      data: { status: true, data: {} },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }
  }

  try {
    await TradlySDK.init.config({ token: 'contract-public-key', environment: 'production' })

    for (const endpoint of endpoints) {
      const previousCount = requests.length
      await endpoint.invoke()
      expect(requests).toHaveLength(previousCount + 1)

      const request = requests[previousCount]
      const actualUrl = new URL(request.url)
      expect(request.method).toBe(endpoint.method)
      expect(actualUrl.pathname).toBe(endpoint.path)
      if (endpoint.expectedQuery) {
        for (const [key, value] of Object.entries(endpoint.expectedQuery)) {
          expect(actualUrl.searchParams.get(key)).toBe(value)
        }
      }
      if (endpoint.expectedBody !== undefined) {
        const body = typeof request.data === 'string' ? JSON.parse(request.data) : request.data
        expect(body).toEqual(endpoint.expectedBody)
      }
    }
  } finally {
    axios.defaults.adapter = originalAdapter
  }
})

test('payment URL builders target their expected Tradly routes', () => {
  const paymentIntentUrl = new URL(checkout.buildPaymentIntentUrl('contract-order', 12, 'contract-auth'))
  expect(paymentIntentUrl.pathname).toBe('/v1/payments/web/paymentIntent')
  expect(paymentIntentUrl.searchParams.get('order_reference')).toBe('contract-order')
  expect(paymentIntentUrl.searchParams.get('payment_method_id')).toBe('12')

  const previousWindow = (globalThis as { window?: unknown }).window
  ;(globalThis as { window?: unknown }).window = { location: { origin: 'https://shop.example.test' } }
  try {
    const externalCheckoutUrl = checkout.buildExternalCheckoutUrl('contract-order', 'contract-auth')
    expect(externalCheckoutUrl.includes('/external_checkout?')).toBe(true)
    expect(externalCheckoutUrl.includes('order_reference=contract-order')).toBe(true)
  } finally {
    if (previousWindow === undefined) delete (globalThis as { window?: unknown }).window
    else (globalThis as { window?: unknown }).window = previousWindow
  }
})

test('signup handles SDK errors and missing response data without crashing', () => {
  expect(parseSignUpResponse({ status: true, data: { verify_id: 'verify-123' } }))
    .toEqual({ verify_id: 'verify-123' })
  expect(parseSignUpResponse(new TypeError("Cannot read properties of undefined (reading 'data')")))
    .toEqual({ error: 'Unable to contact the Tradly service. Check your connection and try again.' })
  expect(parseSignUpResponse({ error: { message: 'Email already exists' } }))
    .toEqual({ error: 'Email already exists' })
  expect(parseSignUpResponse(undefined))
    .toEqual({ error: 'The Tradly service returned an invalid response. Please try again.' })
})

test('shared API response guard rejects missing, failed, and incomplete SDK envelopes', () => {
  expect(getTradlyResponseError(new TypeError('network failure'), 'Request failed'))
    .toBe('Unable to contact the Tradly service. Check your connection and try again.')
  expect(getTradlyResponseError(undefined, 'Request failed'))
    .toBe('The Tradly service returned an invalid response. Please try again.')
  expect(getTradlyResponseError({ status: true, data: {} }, 'Request failed', ['user']))
    .toBe('The Tradly service returned incomplete data. Please try again.')
  expect(getTradlyResponseError({ error: { message: 'Invalid credentials' } }, 'Request failed'))
    .toBe('Invalid credentials')
  expect(getTradlyResponseError({ status: true, data: {} }, 'Request failed'))
    .toBe(undefined)
})

if (process.env.E2E_RUN_LIVE_API_ENDPOINTS === '1') {
  test('all 44 wrapper requests reach the Tradly sandbox and receive an HTTP response', async () => {
    if (AppConfig.env !== 'sandbox') {
      throw new Error('Live endpoint probes require VITE_TRADLY_ENV=sandbox.')
    }
    if (!AppConfig.pkKey) {
      throw new Error('Live endpoint probes require VITE_TRADLY_PK_KEY in .env.')
    }

    const axios = await getTradlyAxios()
    const observations: Array<{
      id: string
      method: string
      path: string
      status?: number
    }> = []
    const requests = new WeakMap<object, (typeof observations)[number]>()
    let activeId = ''

    const requestInterceptor = axios.interceptors.request.use((config: any) => {
      const observed = {
        id: activeId,
        method: String(config.method ?? 'get').toLowerCase(),
        path: new URL(config.url, config.baseURL).pathname,
      }
      observations.push(observed)
      requests.set(config, observed)
      return config
    })
    const responseInterceptor = axios.interceptors.response.use(
      (response: any) => {
        const observed = requests.get(response.config)
        if (observed) observed.status = response.status
        return response
      },
      (error: any) => {
        const observed = error.config ? requests.get(error.config) : undefined
        if (observed) observed.status = error.response?.status
        return Promise.reject(error)
      },
    )

    try {
      await TradlySDK.init.config({ token: AppConfig.pkKey, environment: AppConfig.env })

      for (const endpoint of endpoints) {
        activeId = endpoint.id
        await endpoint.invoke()
      }
    } finally {
      activeId = ''
      axios.interceptors.request.eject(requestInterceptor)
      axios.interceptors.response.eject(responseInterceptor)
    }

    expect(observations).toHaveLength(endpoints.length)
    for (const [index, endpoint] of endpoints.entries()) {
      const observed = observations[index]
      expect(observed.id).toBe(endpoint.id)
      expect(observed.method).toBe(endpoint.method)
      expect(observed.path).toBe(endpoint.path)
      expect(typeof observed.status).toBe('number')
      expect((observed.status ?? 500) < 500).toBe(true)
    }
  })
}
