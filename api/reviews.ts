import TradlySDK from 'tradly'
import { AppConfig } from '@/config/app.config'

export type ReviewQuery = Record<string, unknown>
export type ReviewInput = Record<string, unknown>

export const getReviews = (params: ReviewQuery, authKey: string, currency: string, language: string): Promise<any> =>
  (TradlySDK as any).app.getReviewList({ bodyParam: params, pkKey: AppConfig.pkKey, authKey, currency, language })

export const createReview = (data: ReviewInput, authKey: string, currency: string, language: string): Promise<any> =>
  (TradlySDK as any).app.addReview({ data, pkKey: AppConfig.pkKey, authKey, currency, language })

export const setReviewReaction = (reviewId: number | string, status: 1 | 2, authKey: string, currency: string, language: string): Promise<any> =>
  (TradlySDK as any).app.likeReview({ id: String(reviewId), data: { status }, pkKey: AppConfig.pkKey, authKey, currency, language })
