import TradlySDK from 'tradly'
import { buildAppQueryPayload } from './sdk-context.ts'
import type { ListingAttribute, TradlyListingSdkResponse } from '@/types/listing.types'

export interface GetAttributesParams {
  type?: 'listings' | 'accounts'
  category_id?: number
  [key: string]: unknown
}

export const getAttributes = (
  params: GetAttributesParams,
  authKey: string,
  currency: string,
  language: string,
): Promise<TradlyListingSdkResponse<{ attributes: ListingAttribute[] }>> =>
  (TradlySDK as any).app.getAttribute(
    buildAppQueryPayload(params as Record<string, unknown>, authKey, currency, language),
  )
