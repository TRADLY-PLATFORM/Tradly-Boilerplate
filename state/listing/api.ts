import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { GetListingsResponse, GetListingDetailResponse } from '@/types/listing.types'
import * as listingAPI from '@/api/listing'
import type {
  GetListingsParams,
  GetListingDetailInput,
  LikeListingInput,
} from '@/types/listing.types'
import { normalizeTradlyResponse } from '@/state/api-response'
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

// Scans every cached query entry and patches liked/unliked/likes/unlikes in place.
// selectInvalidatedBy(broad tag) misses detail entries that use specific tags
// {type:'Listing', id:slug}, so we read the raw queries map instead.
function patchLikeInCache(
  dispatch: (action: unknown) => { undo: () => void },
  getState: () => unknown,
  listingId: number,
  liked: boolean,
) {
  const queries = ((getState() as Record<string, unknown>)['listingApi'] as { queries: Record<string, { endpointName: string; originalArgs: unknown }> }).queries
  const patches: Array<{ undo: () => void }> = []

  Object.values(queries).forEach(entry => {
    if (!entry) return

    if (entry.endpointName === 'getListings') {
      patches.push(
        dispatch(
          listingApi.util.updateQueryData('getListings', entry.originalArgs as GetListingsParams, draft => {
            const l = draft.listings.find(l => l.id === listingId)
            if (!l) return
            if (liked) {
              l.liked = true; l.unliked = false; l.likes += 1
            } else {
              l.liked = false; l.unliked = true; l.likes = Math.max(0, l.likes - 1); l.unlikes += 1
            }
          }),
        ),
      )
    }

    if (entry.endpointName === 'getListingDetail') {
      patches.push(
        dispatch(
          listingApi.util.updateQueryData('getListingDetail', entry.originalArgs as GetListingDetailInput, draft => {
            if (draft.listing.id !== listingId) return
            if (liked) {
              draft.listing.liked = true; draft.listing.unliked = false; draft.listing.likes += 1
            } else {
              draft.listing.liked = false; draft.listing.unliked = true; draft.listing.likes = Math.max(0, draft.listing.likes - 1); draft.listing.unlikes += 1
            }
          }),
        ),
      )
    }
  })

  return patches
}

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
          const res = normalizeTradlyResponse(await listingAPI.getListings(params, authKey, currency, language), 'Failed to fetch listings', ['listings', 'page', 'total_records'])
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
          return { error: { status: 'CUSTOM_ERROR', error: (err instanceof Error ? err.message : 'Unexpected error') } }
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
          const res = normalizeTradlyResponse(await listingAPI.getListingDetail(slug, useId, authKey, currency, language), 'Listing not found', ['listing'])
          if (res?.error)
            return { error: { status: 'CUSTOM_ERROR', error: res.error.message ?? 'Listing not found' } }
          return { data: { listing: res.data!.listing } }
        } catch (err) {
          return { error: { status: 'CUSTOM_ERROR', error: (err instanceof Error ? err.message : 'Unexpected error') } }
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
          const res = normalizeTradlyResponse(await listingAPI.likeListing(id, authKey, currency, language), 'Like failed')
          if (res?.error)
            return { error: { status: 'CUSTOM_ERROR', error: res.error.message ?? 'Like failed' } }
          return { data: undefined }
        } catch (err) {
          return { error: { status: 'CUSTOM_ERROR', error: (err instanceof Error ? err.message : 'Unexpected error') } }
        }
      },
      onQueryStarted: async ({ id }, { dispatch, queryFulfilled, getState }) => {
        const patches = patchLikeInCache(dispatch, getState, id, true)
        try { await queryFulfilled } catch { patches.forEach(p => p.undo()) }
      },
    }),

    // Unlike — same optimistic pattern as likeListing.
    unlikeListing: builder.mutation<void, LikeListingInput>({
      queryFn: async ({ id }, { getState }) => {
        const { authKey, currency, language } = getContext(getState() as LocalState)
        try {
          const res = normalizeTradlyResponse(await listingAPI.unlikeListing(id, authKey, currency, language), 'Unlike failed')
          if (res?.error)
            return { error: { status: 'CUSTOM_ERROR', error: res.error.message ?? 'Unlike failed' } }
          return { data: undefined }
        } catch (err) {
          return { error: { status: 'CUSTOM_ERROR', error: (err instanceof Error ? err.message : 'Unexpected error') } }
        }
      },
      onQueryStarted: async ({ id }, { dispatch, queryFulfilled, getState }) => {
        const patches = patchLikeInCache(dispatch, getState, id, false)
        try { await queryFulfilled } catch { patches.forEach(p => p.undo()) }
      },
    }),

    createListing: builder.mutation<{ listing: import('@/types/listing.types').Listing }, Record<string, unknown>>({
      queryFn: async (listing, { getState }) => {
        const { authKey, currency, language } = getContext(getState() as LocalState)
        try {
          const res = normalizeTradlyResponse(await listingAPI.createListing(listing, authKey, currency, language), 'Could not publish listing', ['listing'])
          if (res?.error) return { error: { status: 'CUSTOM_ERROR', error: res.error.message ?? 'Could not publish listing' } }
          return { data: { listing: res.data!.listing } }
        } catch (err) {
          return { error: { status: 'CUSTOM_ERROR', error: err instanceof Error ? err.message : 'Unexpected error' } }
        }
      },
      invalidatesTags: ['Listing'],
    }),

  }),
})

export const {
  useGetListingsQuery,
  useGetListingDetailQuery,
  useLikeListingMutation,
  useUnlikeListingMutation,
  useCreateListingMutation,
} = listingApi
