import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { GetListingsResponse, GetListingDetailResponse } from '@/types/listing.types'
import * as listingAPI from '@/api/listing'
import type {
  GetListingsParams,
  GetListingDetailInput,
  LikeListingInput,
} from '@/types/listing.types'
// LikeListingInput = { id: number } — used for both like and unlike mutations

// Minimal local type — avoids circular dependency with store.ts
interface LocalState {
  auth: { authKey: string }
  app: { currency: string; language: string }
}

const getContext = (state: LocalState) => ({
  authKey: state.auth.authKey,
  currency: state.app.currency,
  language: state.app.language,
})

export const listingApi = createApi({
  reducerPath: 'listingApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  tagTypes: ['Listing'],
  // Cache listing data for 5 minutes after the last subscriber unmounts.
  // Prevents unnecessary re-fetches when navigating between pages.
  keepUnusedDataFor: 300,
  endpoints: (builder) => ({

    // result.data → { listings: Listing[], page, total_records }
    getListings: builder.query<GetListingsResponse, GetListingsParams>({
      queryFn: async (params, { getState }) => {
        const { authKey, currency, language } = getContext(getState() as LocalState)
        try {
          const res = await listingAPI.getListings(params, authKey, currency, language)
          if (res?.error)
            return { error: { status: 'CUSTOM_ERROR', error: res.error.message ?? 'Failed to fetch listings' } }
          return {
            data: {
              listings: res.data!.listings,
              page: res.data!.page,
              total_records: res.data!.total_records,
            },
          }
        } catch (err) {
          return { error: { status: 'CUSTOM_ERROR', error: (err as Error).message } }
        }
      },
      providesTags: ['Listing'],
    }),

    // result.data → { listing: Listing }
    getListingDetail: builder.query<GetListingDetailResponse, GetListingDetailInput>({
      queryFn: async ({ slug, id }, { getState }) => {
        const { authKey, currency, language } = getContext(getState() as LocalState)
        const useId = id === true || id === 'true'
        try {
          const res = await listingAPI.getListingDetail(slug, useId, authKey, currency, language)
          if (res?.error)
            return { error: { status: 'CUSTOM_ERROR', error: res.error.message ?? 'Listing not found' } }
          return { data: { listing: res.data!.listing } }
        } catch (err) {
          return { error: { status: 'CUSTOM_ERROR', error: (err as Error).message } }
        }
      },
      providesTags: (_result, _err, { slug }) => [{ type: 'Listing', id: slug }],
    }),

    // Like — optimistic update: flip liked/likes in cache immediately, revert on failure.
    // Does NOT invalidate the listing list — avoids a full re-fetch just for a heart tap.
    likeListing: builder.mutation<void, LikeListingInput>({
      queryFn: async ({ id }, { getState }) => {
        const { authKey, currency, language } = getContext(getState() as LocalState)
        try {
          const res = await listingAPI.likeListing(id, authKey, currency, language)
          if (res?.error)
            return { error: { status: 'CUSTOM_ERROR', error: res.error.message ?? 'Like failed' } }
          return { data: undefined }
        } catch (err) {
          return { error: { status: 'CUSTOM_ERROR', error: (err as Error).message } }
        }
      },
      // Optimistically update every cached list and the detail entry for this listing.
      // On failure the patch is rolled back automatically by RTK Query.
      onQueryStarted: async ({ id }, { dispatch, queryFulfilled, getState }) => {
        // Patch all getListings cache entries that contain this listing
        const listPatches = listingApi.util.selectInvalidatedBy(getState(), ['Listing'])
          .filter(({ endpointName }) => endpointName === 'getListings')
          .map(({ originalArgs }) =>
            dispatch(
              listingApi.util.updateQueryData('getListings', originalArgs as GetListingsParams, (draft) => {
                const listing = (draft as GetListingsResponse).listings.find(l => l.id === id)
                if (listing) { listing.liked = true; listing.unliked = false; listing.likes += 1 }
              }),
            ),
          )

        // Patch detail cache entry if it exists (keyed by slug — we scan all detail entries)
        const detailPatches = listingApi.util.selectInvalidatedBy(getState(), ['Listing'])
          .filter(({ endpointName }) => endpointName === 'getListingDetail')
          .map(({ originalArgs }) =>
            dispatch(
              listingApi.util.updateQueryData('getListingDetail', originalArgs as GetListingDetailInput, (draft) => {
                const l = (draft as GetListingDetailResponse).listing
                if (l.id === id) { l.liked = true; l.unliked = false; l.likes += 1 }
              }),
            ),
          )

        try {
          await queryFulfilled
        } catch {
          listPatches.forEach(p => p.undo())
          detailPatches.forEach(p => p.undo())
        }
      },
    }),

    // Unlike — same optimistic pattern as likeListing.
    unlikeListing: builder.mutation<void, LikeListingInput>({
      queryFn: async ({ id }, { getState }) => {
        const { authKey, currency, language } = getContext(getState() as LocalState)
        try {
          const res = await listingAPI.unlikeListing(id, authKey, currency, language)
          if (res?.error)
            return { error: { status: 'CUSTOM_ERROR', error: res.error.message ?? 'Unlike failed' } }
          return { data: undefined }
        } catch (err) {
          return { error: { status: 'CUSTOM_ERROR', error: (err as Error).message } }
        }
      },
      onQueryStarted: async ({ id }, { dispatch, queryFulfilled, getState }) => {
        const listPatches = listingApi.util.selectInvalidatedBy(getState(), ['Listing'])
          .filter(({ endpointName }) => endpointName === 'getListings')
          .map(({ originalArgs }) =>
            dispatch(
              listingApi.util.updateQueryData('getListings', originalArgs as GetListingsParams, (draft) => {
                const listing = (draft as GetListingsResponse).listings.find(l => l.id === id)
                if (listing) { listing.liked = false; listing.unliked = true; listing.unlikes += 1; listing.likes = Math.max(0, listing.likes - 1) }
              }),
            ),
          )

        const detailPatches = listingApi.util.selectInvalidatedBy(getState(), ['Listing'])
          .filter(({ endpointName }) => endpointName === 'getListingDetail')
          .map(({ originalArgs }) =>
            dispatch(
              listingApi.util.updateQueryData('getListingDetail', originalArgs as GetListingDetailInput, (draft) => {
                const l = (draft as GetListingDetailResponse).listing
                if (l.id === id) { l.liked = false; l.unliked = true; l.unlikes += 1; l.likes = Math.max(0, l.likes - 1) }
              }),
            ),
          )

        try {
          await queryFulfilled
        } catch {
          listPatches.forEach(p => p.undo())
          detailPatches.forEach(p => p.undo())
        }
      },
    }),

  }),
})

export const {
  useGetListingsQuery,
  useGetListingDetailQuery,
  useLikeListingMutation,
  useUnlikeListingMutation,
} = listingApi
