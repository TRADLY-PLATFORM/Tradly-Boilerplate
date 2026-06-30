import TradlySDK from 'tradly'
import { buildAppQueryPayload } from '@/api/sdk-context'
import type { GetCommissionsResponse, TradlyCheckoutSdkResponse } from '@/types/checkout.types'

// type: 'cart' for cart commissions, 'demand' + optional:true for demand commissions
export const getCommissions = (
  params: { type: string; optional?: boolean },
  authKey: string,
  currency: string,
  language: string,
): Promise<TradlyCheckoutSdkResponse<GetCommissionsResponse>> =>
  (TradlySDK as any).app.getCommissions(
    buildAppQueryPayload(params as Record<string, unknown>, authKey, currency, language),
  )
