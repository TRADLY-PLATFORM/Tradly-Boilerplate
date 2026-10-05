import TradlySDK from 'tradly'
import { buildAppQueryPayload } from './sdk-context.ts'
import type {
  GetPaymentMethodsResponse,
  TradlyCheckoutSdkResponse,
} from '@/types/checkout.types'

export const getPaymentMethods = (
  authKey: string,
  currency: string,
  language: string,
): Promise<TradlyCheckoutSdkResponse<GetPaymentMethodsResponse>> =>
  (TradlySDK as any).app.getPaymentMethods(
    buildAppQueryPayload({}, authKey, currency, language),
  )
