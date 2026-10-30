import TradlySDK from 'tradly'
import { AppConfig } from '@/config/app.config'

export interface SubscriptionProductsQuery {
  account_id: number | string
  type?: string
  [key: string]: unknown
}

export interface SubscriptionReceiptInput {
  account_id: number | string
  subscription_product_id: number | string
  token: string
  [key: string]: unknown
}

export const getSubscriptionProducts = (params: Record<string, unknown>, authKey: string, currency: string, language: string): Promise<any> =>
  call('/v1/subscription_products', 'GET', authKey, currency, language, params)

export const getSubscriptionProduct = (id: number | string, authKey: string, currency: string, language: string): Promise<any> =>
  call(`/v1/subscription_products/${id}`, 'GET', authKey, currency, language)

const call = (path: string, Method: 'GET' | 'POST' | 'DELETE', authKey: string, currency: string, language: string, bodyParam?: Record<string, unknown>, data?: Record<string, unknown>): Promise<any> =>
  (TradlySDK as any).app.commonFuntion({ path, Method, ...(bodyParam ? { bodyParam } : {}), ...(data ? { data } : {}), pkKey: AppConfig.pkKey, authKey, currency, language })

export const getAvailableSubscriptionProducts = (params: SubscriptionProductsQuery, authKey: string, currency: string, language: string): Promise<any> =>
  call('/v1/subscriptions/subscribe/products', 'GET', authKey, currency, language, params)

export const subscribeWithReceipt = (input: SubscriptionReceiptInput, authKey: string, currency: string, language: string): Promise<any> =>
  call('/v1/subscriptions/subscribe', 'POST', authKey, currency, language, undefined, input)

export const confirmSubscriptionWithReceipt = (input: SubscriptionReceiptInput, authKey: string, currency: string, language: string): Promise<any> =>
  call('/v1/subscriptions/subscribe/confirm', 'POST', authKey, currency, language, undefined, input)

export const triggerSubscriptionEmail = (accountId: number | string, authKey: string, currency: string, language: string): Promise<any> =>
  call('/v1/subscriptions/email_trigger', 'POST', authKey, currency, language, undefined, { account_id: accountId })

export const cancelSubscription = (accountId: number | string, authKey: string, currency: string, language: string): Promise<any> =>
  call('/v1/subscriptions/unsubscribe', 'DELETE', authKey, currency, language, undefined, { account_id: accountId })

export const getSubscriptionManageUrl = (accountUniqueId: string, tenantUniqueId: string, authKey: string, currency: string, language: string): Promise<any> =>
  call('/v1/subscriptions/subscribe/manage', 'GET', authKey, currency, language, { account_id: accountUniqueId, tenant_id: tenantUniqueId })
