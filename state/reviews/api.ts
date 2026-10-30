import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import * as reviewsAPI from '@/api/reviews'
import { normalizeTradlyResponse } from '@/state/api-response'

interface LocalState { auth: { authKey: string }; app: { currency: string; language: string } }
const context = (state: LocalState) => ({ authKey: state.auth.authKey, currency: state.app.currency, language: state.app.language })

export const reviewsApi = createApi({
  reducerPath: 'reviewsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  tagTypes: ['Review'],
  endpoints: builder => ({
    getReviews: builder.query<Record<string, unknown>, Record<string, unknown>>({
      queryFn: async (params, { getState }) => {
        const ctx = context(getState() as LocalState)
        try {
          const response = normalizeTradlyResponse(await reviewsAPI.getReviews(params, ctx.authKey, ctx.currency, ctx.language), 'Could not load reviews')
          if (response.error) return { error: { status: 'CUSTOM_ERROR', error: response.error.message ?? 'Could not load reviews' } }
          return { data: (response as any).data ?? {} }
        } catch (error) { return { error: { status: 'CUSTOM_ERROR', error: error instanceof Error ? error.message : 'Unexpected error' } } }
      },
      providesTags: ['Review'],
    }),
    createReview: builder.mutation<Record<string, unknown>, Record<string, unknown>>({
      queryFn: async (review, { getState }) => {
        const ctx = context(getState() as LocalState)
        try {
          const response = normalizeTradlyResponse(await reviewsAPI.createReview(review, ctx.authKey, ctx.currency, ctx.language), 'Could not submit review')
          if (response.error) return { error: { status: 'CUSTOM_ERROR', error: response.error.message ?? 'Could not submit review' } }
          return { data: (response as any).data ?? {} }
        } catch (error) { return { error: { status: 'CUSTOM_ERROR', error: error instanceof Error ? error.message : 'Unexpected error' } } }
      },
      invalidatesTags: ['Review'],
    }),
    setReviewReaction: builder.mutation<void, { reviewId: number | string; status: 1 | 2 }>({
      queryFn: async ({ reviewId, status }, { getState }) => {
        const ctx = context(getState() as LocalState)
        try {
          const response = normalizeTradlyResponse(await reviewsAPI.setReviewReaction(reviewId, status, ctx.authKey, ctx.currency, ctx.language), 'Could not update review reaction')
          if (response.error) return { error: { status: 'CUSTOM_ERROR', error: response.error.message ?? 'Could not update review reaction' } }
          return { data: undefined }
        } catch (error) { return { error: { status: 'CUSTOM_ERROR', error: error instanceof Error ? error.message : 'Unexpected error' } } }
      },
      invalidatesTags: ['Review'],
    }),
  }),
})

export const { useGetReviewsQuery, useCreateReviewMutation, useSetReviewReactionMutation } = reviewsApi
