import TradlySDK from 'tradly'
import { AppConfig } from '@/config/app.config'

const call = (path: string, Method: string, authKey: string, currency: string, language: string, data?: unknown, bodyParam?: Record<string, unknown>): Promise<any> =>
  (TradlySDK as any).app.commonFuntion({ path, Method, ...(data !== undefined ? { data } : {}), ...(bodyParam ? { bodyParam } : {}), pkKey: AppConfig.pkKey, authKey, currency, language })

export const getBundleItems = (listingId: number | string, authKey: string, currency: string, language: string): Promise<any> =>
  call(`/v1/bundles/${listingId}/items`, 'GET', authKey, currency, language)

export const addBundleItem = (listingId: number | string, input: { component_listing_id: number; quantity: number; order_by?: number }, authKey: string, currency: string, language: string): Promise<any> =>
  call(`/v1/bundles/${listingId}/items`, 'POST', authKey, currency, language, input)

export const updateBundleItem = (listingId: number | string, itemId: number | string, input: { quantity?: number; order_by?: number; metadata?: Record<string, unknown> }, authKey: string, currency: string, language: string): Promise<any> =>
  call(`/v1/bundles/${listingId}/items/${itemId}`, 'PUT', authKey, currency, language, input)

export const deleteBundleItem = (listingId: number | string, itemId: number | string, authKey: string, currency: string, language: string): Promise<any> =>
  call(`/v1/bundles/${listingId}/items/${itemId}`, 'DELETE', authKey, currency, language)

export const getBundleStock = (listingId: number | string, quantity: number, authKey: string, currency: string, language: string): Promise<any> =>
  call(`/v1/bundles/${listingId}/stock`, 'GET', authKey, currency, language, undefined, { quantity })

export const getBundlePool = (listingId: number | string, authKey: string, currency: string, language: string): Promise<any> =>
  call(`/v1/bundles/${listingId}/pool`, 'GET', authKey, currency, language)

export const addBundlePoolItem = (listingId: number | string, input: { component_listing_id: number; order_by?: number }, authKey: string, currency: string, language: string): Promise<any> =>
  call(`/v1/bundles/${listingId}/pool`, 'POST', authKey, currency, language, input)

export const updateBundlePoolItem = (listingId: number | string, itemId: number | string, input: { order_by?: number }, authKey: string, currency: string, language: string): Promise<any> =>
  call(`/v1/bundles/${listingId}/pool/${itemId}`, 'PUT', authKey, currency, language, input)

export const deleteBundlePoolItem = (listingId: number | string, itemId: number | string, authKey: string, currency: string, language: string): Promise<any> =>
  call(`/v1/bundles/${listingId}/pool/${itemId}`, 'DELETE', authKey, currency, language)

export const submitBundleSelection = (listingId: number | string, input: { selected_listing_ids: number[]; quantity: number }, authKey: string, currency: string, language: string): Promise<any> =>
  call(`/v1/bundles/${listingId}/select`, 'POST', authKey, currency, language, input)

export const getBundleSelection = (listingId: number | string, selectionId: number | string, authKey: string, currency: string, language: string): Promise<any> =>
  call(`/v1/bundles/${listingId}/selections/${selectionId}`, 'GET', authKey, currency, language)

export const getBundleOrderComponents = (listingId: number | string, orderId: number | string, authKey: string, currency: string, language: string): Promise<any> =>
  call(`/v1/bundles/${listingId}/orders/${orderId}/components`, 'GET', authKey, currency, language)
