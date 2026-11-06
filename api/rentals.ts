import TradlySDK from 'tradly'
import { AppConfig } from '@/config/app.config'

export interface RentalSettingsInput {
  listing_id: number
  rate_unit: 'hour' | 'day' | 'week'
  rate_amount: number
  min_duration: number
  max_duration: number
  buffer_time: number
  deposit_amount: number
  max_units: number
}

export interface RentalAvailabilityParams {
  listing_id: number
  start_at: string
  end_at: string
  units: number
}

const call = (
  path: string,
  Method: 'GET' | 'POST',
  authKey: string,
  currency: string,
  language: string,
  data?: unknown,
  bodyParam?: Record<string, unknown>,
): Promise<any> => (TradlySDK as any).app.commonFuntion({
  path,
  Method,
  ...(data !== undefined ? { data } : {}),
  ...(bodyParam ? { bodyParam } : {}),
  pkKey: AppConfig.pkKey,
  authKey,
  currency,
  language,
})

// Tradly docs: POST /v1/rentals/settings
export const createRentalSettings = (
  input: RentalSettingsInput,
  authKey: string,
  currency: string,
  language: string,
): Promise<any> => call('/v1/rentals/settings', 'POST', authKey, currency, language, input)

// GET /v1/rentals/settings?listing_id= (works with the public key). Listing detail does NOT return the rental
// settings, so the rental page reads them from here.
export const getRentalSettings = (
  listingId: number,
  authKey: string,
  currency: string,
  language: string,
): Promise<any> => call('/v1/rentals/settings', 'GET', authKey, currency, language, undefined, { listing_id: listingId })

// Tradly docs: GET /v1/rentals/availability?listing_id=&start_at=&end_at=&units=
export const getRentalAvailability = (
  params: RentalAvailabilityParams,
  authKey: string,
  currency: string,
  language: string,
): Promise<any> => call('/v1/rentals/availability', 'GET', authKey, currency, language, undefined, { ...params })
