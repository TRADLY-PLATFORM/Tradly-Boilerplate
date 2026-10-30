import TradlySDK from 'tradly'
import { AppConfig } from '@/config/app.config'

export interface CreateMembershipInput {
  listing_id: number
  membership_id: string
  status?: 'active' | 'expired' | 'cancelled'
  start_date?: string
  end_date?: string
  duration_months?: number
  metadata?: Record<string, unknown>
}

export interface GetMembershipsParams {
  listing_id?: number
  status?: 'active' | 'expired' | 'cancelled'
  membership_id?: string
  page?: number
  per_page?: number
}

export const createMembership = (input: CreateMembershipInput, authKey: string, currency: string, language: string): Promise<any> =>
  (TradlySDK as any).app.commonFuntion({
    path: '/v1/memberships', Method: 'POST', data: { membership: input },
    pkKey: AppConfig.pkKey, authKey, currency, language,
  })

export const getMemberships = (params: GetMembershipsParams, authKey: string, currency: string, language: string): Promise<any> =>
  (TradlySDK as any).app.commonFuntion({
    path: '/v1/memberships', Method: 'GET', bodyParam: params,
    pkKey: AppConfig.pkKey, authKey, currency, language,
  })

export const getMembershipDetail = (membershipId: string, listingId: number, authKey: string, currency: string, language: string): Promise<any> =>
  (TradlySDK as any).app.commonFuntion({
    path: `/v1/memberships/${encodeURIComponent(membershipId)}`, Method: 'GET', bodyParam: { listing_id: listingId },
    pkKey: AppConfig.pkKey, authKey, currency, language,
  })

export const recordMembershipContribution = (membershipId: string, input: { listing_id: number; order_id: number }, authKey: string, currency: string, language: string): Promise<any> =>
  (TradlySDK as any).app.commonFuntion({
    path: `/v1/memberships/${encodeURIComponent(membershipId)}/contributions`, Method: 'POST', data: input,
    pkKey: AppConfig.pkKey, authKey, currency, language,
  })

export const getMembershipPriceLogs = (params: { listing_id: number; page?: number; per_page?: number }, authKey: string, currency: string, language: string): Promise<any> =>
  (TradlySDK as any).app.commonFuntion({
    path: '/v1/memberships/price_logs', Method: 'GET', bodyParam: params,
    pkKey: AppConfig.pkKey, authKey, currency, language,
  })
