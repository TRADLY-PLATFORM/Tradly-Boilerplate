import TradlySDK from 'tradly'
import { AppConfig } from '@/config/app.config'
import type { GetPromotionsParams, TradlyId } from '@/types/prompt-apis.types'

const call = (path: string, Method: string, authKey: string, currency: string, language: string, bodyParam?: Record<string, unknown>): Promise<any> =>
  (TradlySDK as any).app.commonFuntion({ path, Method, ...(bodyParam ? { bodyParam } : {}), pkKey: AppConfig.pkKey, authKey, currency, language })

export const searchTags = (params: Record<string, unknown>, authKey: string, currency: string, language: string): Promise<any> =>
  call('/v1/tags/search', 'GET', authKey, currency, language, params)

// The public collection pages currently omit their route paths; the project SDK
// maps these reads to /v1/collections and /v1/collections/{id}.
export const getCollections = (authKey: string, currency: string, language: string): Promise<any> =>
  (TradlySDK as any).app.getCollection({ pkKey: AppConfig.pkKey, authKey, currency, language })

export const getCollectionDetail = (id: TradlyId, authKey: string, currency: string, language: string): Promise<any> =>
  (TradlySDK as any).app.getCollectionDetail({ id: String(id), pkKey: AppConfig.pkKey, authKey, currency, language })

export const getCollectionData = (params: Record<string, unknown>, authKey: string, currency: string, language: string): Promise<any> =>
  (TradlySDK as any).app.getCollectionData({ bodyParam: params, pkKey: AppConfig.pkKey, authKey, currency, language })

export const getPromotions = (params: GetPromotionsParams, authKey: string, currency: string, language: string): Promise<any> =>
  call('/v1/promos', 'GET', authKey, currency, language, params)

export const getPromotionDetail = (id: TradlyId, authKey: string, currency: string, language: string): Promise<any> =>
  call(`/v1/promos/${id}`, 'GET', authKey, currency, language)
