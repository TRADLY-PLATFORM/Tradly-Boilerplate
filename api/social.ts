import TradlySDK from 'tradly'
import { AppConfig } from '@/config/app.config'
import type { GetFeedParams } from '@/types/prompt-apis.types'

const call = (path: string, authKey: string, currency: string, language: string, bodyParam?: Record<string, unknown>): Promise<any> =>
  (TradlySDK as any).app.commonFuntion({ path, Method: 'GET', ...(bodyParam ? { bodyParam } : {}), pkKey: AppConfig.pkKey, authKey, currency, language })

export const getHomeFeed = (params: GetFeedParams, authKey: string, currency: string, language: string): Promise<any> =>
  call('/v1/home', authKey, currency, language, params)

export const getActivityFeed = (params: GetFeedParams, authKey: string, currency: string, language: string): Promise<any> =>
  call('/v1/activities', authKey, currency, language, params)

export const getFollowingFeed = (params: GetFeedParams & { page: number; type: 'listings' | string }, authKey: string, currency: string, language: string): Promise<any> =>
  call('/v1/feeds/following', authKey, currency, language, { ...params, type: 'listings' })

export const getFollowingAccounts = (params: GetFeedParams, authKey: string, currency: string, language: string): Promise<any> =>
  (TradlySDK as any).app.getFollowingAccounts({ bodyParam: params, pkKey: AppConfig.pkKey, authKey, currency, language })
