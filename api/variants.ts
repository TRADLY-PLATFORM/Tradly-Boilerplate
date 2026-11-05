import TradlySDK from 'tradly'
import { AppConfig } from '@/config/app.config'
import type { CreateListingVariantInput } from '@/types/variant.types'

export const getVariantTypes = (authKey: string, currency: string, language: string): Promise<any> =>
  (TradlySDK as any).app.getVariantTypes({ authKey, currency, language, pkKey: AppConfig.pkKey })

export const getVariantTypeValues = (variantTypeId: number | string, authKey: string, currency: string, language: string): Promise<any> =>
  (TradlySDK as any).app.getVariantTypeValues({ id: String(variantTypeId), authKey, currency, language, pkKey: AppConfig.pkKey })

export const getListingVariants = (listingId: number | string, authKey: string, currency: string, language: string): Promise<any> =>
  (TradlySDK as any).app.getListingVariants({ listingId: String(listingId), authKey, currency, language, pkKey: AppConfig.pkKey })

export const getListingVariantDetail = (listingId: number | string, variantId: number | string, authKey: string, currency: string, language: string): Promise<any> =>
  (TradlySDK as any).app.commonFuntion({ path: `/v1/listings/${listingId}/variants/${variantId}`, Method: 'GET', pkKey: AppConfig.pkKey, authKey, currency, language })

export const createListingVariant = (listingId: number | string, variant: CreateListingVariantInput, authKey: string, currency: string, language: string): Promise<any> =>
  (TradlySDK as any).app.addEditVariants({ listingId: String(listingId), data: { variant }, authKey, currency, language, pkKey: AppConfig.pkKey })

export const updateListingVariant = (listingId: number | string, variantId: number | string, variant: Partial<CreateListingVariantInput>, authKey: string, currency: string, language: string): Promise<any> =>
  (TradlySDK as any).app.commonFuntion({ path: `/v1/listings/${listingId}/variants/${variantId}`, Method: 'PUT', data: { variant }, pkKey: AppConfig.pkKey, authKey, currency, language })

export const deleteListingVariant = (listingId: number | string, variantId: number | string, authKey: string, currency: string, language: string): Promise<any> =>
  (TradlySDK as any).app.deleteVariant({ listingId: String(listingId), id: String(variantId), authKey, currency, language, pkKey: AppConfig.pkKey })
