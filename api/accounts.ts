import TradlySDK from 'tradly'
import { buildAppQueryPayload } from './sdk-context.ts'
import type { TradlyListingSdkResponse } from '@/types/listing.types'
import { AppConfig } from '@/config/app.config'

const common = (path: string, Method: string, authKey: string, currency: string, language: string, bodyParam?: Record<string, unknown>): Promise<any> =>
  (TradlySDK as any).app.commonFuntion({ path, Method, ...(bodyParam ? { bodyParam } : {}), pkKey: AppConfig.pkKey, authKey, currency, language })

export interface SellerAccount {
  id: number
  name: string
  description?: string
  category_id?: number[]
  [key: string]: unknown
}

export const getMyAccounts = (
  userId: string,
  authKey: string,
  currency: string,
  language: string,
): Promise<TradlyListingSdkResponse<{ accounts: SellerAccount[] }>> =>
  (TradlySDK as any).app.getAccounts(
    buildAppQueryPayload({ user_id: userId, type: 'accounts', page: 1 }, authKey, currency, language),
  )

export const createAccount = (
  account: Record<string, unknown>,
  authKey: string,
  currency: string,
  language: string,
): Promise<TradlyListingSdkResponse<{ account: SellerAccount }>> =>
  (TradlySDK as any).app.postAccounts({
    pkKey: AppConfig.pkKey,
    authKey,
    currency,
    language,
    data: { account },
  })

export const updateAccount = (
  accountId: number | string,
  account: Record<string, unknown>,
  authKey: string,
  currency: string,
  language: string,
): Promise<TradlyListingSdkResponse<{ account: SellerAccount }>> =>
  (TradlySDK as any).app.postAccounts({
    id: String(accountId), pkKey: AppConfig.pkKey, authKey, currency, language,
    data: { account },
  })

export const patchAccount = (accountId: number | string, patch: { active: boolean }, authKey: string, currency: string, language: string): Promise<any> =>
  (TradlySDK as any).app.activeInactiveAccounts({ id: String(accountId), data: patch, pkKey: AppConfig.pkKey, authKey, currency, language })

export const getAccountDetail = (accountId: number | string, authKey: string, currency: string, language: string): Promise<any> =>
  common(`/v1/accounts/${accountId}`, 'GET', authKey, currency, language)

export const getAccountFollowers = (accountId: number | string, authKey: string, currency: string, language: string): Promise<any> =>
  common(`/v1/users/account_followers/${accountId}`, 'GET', authKey, currency, language)

/** SDK-only: the public endpoint index omits this blocked-account feed. */
export const getBlockedAccounts = (params: Record<string, unknown>, authKey: string, currency: string, language: string): Promise<any> =>
  (TradlySDK as any).app.getBlockAccounts(buildAppQueryPayload({ page: 1, ...params }, authKey, currency, language))

export const followAccount = (accountId: number | string, authKey: string, currency: string, language: string): Promise<any> =>
  common(`/v1/accounts/${accountId}/follow`, 'POST', authKey, currency, language)

export const unfollowAccount = (accountId: number | string, authKey: string, currency: string, language: string): Promise<any> =>
  common(`/v1/accounts/${accountId}/follow`, 'DELETE', authKey, currency, language)

export const blockAccount = (accountId: number | string, authKey: string, currency: string, language: string): Promise<any> =>
  common(`/v1/accounts/${accountId}/block`, 'POST', authKey, currency, language)

export const unblockAccount = (accountId: number | string, authKey: string, currency: string, language: string): Promise<any> =>
  common(`/v1/accounts/${accountId}/block`, 'DELETE', authKey, currency, language)
