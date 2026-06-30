import TradlySDK from 'tradly'
import { buildAppQueryPayload, buildAppDirectPayload } from '@/api/sdk-context'
import type {
  Category,
  GetCategoriesParams,
  GetCategoriesResponse,
  GetCategoryDetailResponse,
  GetCategoryListingsParams,
  TraldyCategorySdkResponse,
} from '@/types/category.types'
import type { Listing } from '@/types/listing.types'
import type { TradlyListingSdkResponse } from '@/types/listing.types'

// Fetch all categories (listing or account type)
export const getCategories = (
  params: GetCategoriesParams,
  authKey: string,
  currency: string,
  language: string,
): Promise<TraldyCategorySdkResponse<GetCategoriesResponse>> => {
  const bodyParam = params.page ? { ...params } : { ...params, page: 1 }
  return (TradlySDK as any).app.getCategory(
    buildAppQueryPayload(bodyParam as Record<string, unknown>, authKey, currency, language),
  )
}

// Fetch single category by slug
export const getCategoryBySlug = (
  slug: string,
  authKey: string,
  currency: string,
  language: string,
): Promise<TraldyCategorySdkResponse<GetCategoryDetailResponse>> =>
  (TradlySDK as any).app.getSingleCategoryBySlug(
    buildAppDirectPayload({ slug }, authKey, currency, language),
  )

// Fetch single category by ID
export const getCategoryById = (
  categoryId: string | number,
  authKey: string,
  currency: string,
  language: string,
): Promise<TraldyCategorySdkResponse<GetCategoryDetailResponse>> =>
  (TradlySDK as any).app.getSingleCategoryByID(
    buildAppDirectPayload({ categoryID: categoryId }, authKey, currency, language),
  )

// Fetch listings filtered by category — reuses the listings SDK method
export const getCategoryListings = (
  params: GetCategoryListingsParams,
  authKey: string,
  currency: string,
  language: string,
): Promise<TradlyListingSdkResponse<{ listings: Listing[]; page: number; total_records: number }>> => {
  const bodyParam = params.page ? { ...params } : { ...params, page: 1 }
  return (TradlySDK as any).app.getListings(
    buildAppQueryPayload(bodyParam as Record<string, unknown>, authKey, currency, language),
  )
}
