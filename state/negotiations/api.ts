import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import * as negotiationsAPI from '@/api/negotiations'
import type { CreateNegotiationInput, UpdateNegotiationInput } from '@/api/negotiations'
import { normalizeTradlyResponse } from '@/state/api-response'

interface LocalState { auth: { authKey: string }; app: { currency: string; language: string } }
const context = (state: LocalState) => ({ authKey: state.auth.authKey, currency: state.app.currency, language: state.app.language })

export const negotiationsApi = createApi({
  reducerPath: 'negotiationsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  tagTypes: ['Negotiation'],
  endpoints: builder => ({
    createNegotiation: builder.mutation<Record<string, unknown>, { listingId: number | string; offer: CreateNegotiationInput }>({
      queryFn: async ({ listingId, offer }, { getState }) => {
        const ctx = context(getState() as LocalState)
        try {
          const response = normalizeTradlyResponse(await negotiationsAPI.createNegotiation(listingId, offer, ctx.authKey, ctx.currency, ctx.language), 'Could not submit offer')
          if (response.error) return { error: { status: 'CUSTOM_ERROR', error: response.error.message ?? 'Could not submit offer' } }
          return { data: (response as any).data ?? {} }
        } catch (error) { return { error: { status: 'CUSTOM_ERROR', error: error instanceof Error ? error.message : 'Unexpected error' } } }
      },
      invalidatesTags: ['Negotiation'],
    }),
    updateNegotiation: builder.mutation<Record<string, unknown>, { listingId: number | string; negotiationId: number | string; update: UpdateNegotiationInput }>({
      queryFn: async ({ listingId, negotiationId, update }, { getState }) => {
        const ctx = context(getState() as LocalState)
        try {
          const response = normalizeTradlyResponse(await negotiationsAPI.updateNegotiation(listingId, negotiationId, update, ctx.authKey, ctx.currency, ctx.language), 'Could not update offer')
          if (response.error) return { error: { status: 'CUSTOM_ERROR', error: response.error.message ?? 'Could not update offer' } }
          return { data: (response as any).data ?? {} }
        } catch (error) { return { error: { status: 'CUSTOM_ERROR', error: error instanceof Error ? error.message : 'Unexpected error' } } }
      },
      invalidatesTags: ['Negotiation'],
    }),
  }),
})

export const { useCreateNegotiationMutation, useUpdateNegotiationMutation } = negotiationsApi
