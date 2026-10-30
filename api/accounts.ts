import TradlySDK from 'tradly'
import { buildAppQueryPayload } from './sdk-context.ts'
import { AppConfig } from '@/config/app.config'
import type { TradlyListingSdkResponse } from '@/types/listing.types'

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
