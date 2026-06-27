import { listingApi } from './api'
import type { GetListingsParams, GetListingDetailInput } from '@/types/listing.types'

// useQueryState — reads from cache, never triggers a network request.
// Use this in deep child components that need listing data already fetched by a parent.

export const useListingsResult = (params: GetListingsParams) =>
  listingApi.endpoints.getListings.useQueryState(params)

export const useListingDetailResult = (input: GetListingDetailInput) =>
  listingApi.endpoints.getListingDetail.useQueryState(input)
