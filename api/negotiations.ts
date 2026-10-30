import TradlySDK from 'tradly'
import { AppConfig } from '@/config/app.config'

export interface CreateNegotiationInput {
  price: number
  [key: string]: unknown
}

export interface UpdateNegotiationInput {
  status: 2 | 3
  [key: string]: unknown
}

export const createNegotiation = (listingId: number | string, data: CreateNegotiationInput, authKey: string, currency: string, language: string): Promise<any> =>
  (TradlySDK as any).app.addNegotiation({ id: String(listingId), data, pkKey: AppConfig.pkKey, authKey, currency, language })

export const updateNegotiation = (listingId: number | string, negotiationId: number | string, data: UpdateNegotiationInput, authKey: string, currency: string, language: string): Promise<any> =>
  (TradlySDK as any).app.updateNegotiation({ id: String(listingId), negotiation_id: String(negotiationId), data, pkKey: AppConfig.pkKey, authKey, currency, language })
