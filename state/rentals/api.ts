import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import * as rentalsAPI from '@/api/rentals'
import type { RentalAvailabilityParams, RentalSettingsInput } from '@/api/rentals'
import { normalizeTradlyResponse } from '@/state/api-response'

export type RentalSettings = {
  rate_unit: 'hour' | 'day' | 'week'
  rate_amount: number
  min_duration: number
  max_duration: number
  buffer_time: number
  deposit_amount: number
  max_units: number
}

interface LocalState {
  auth: { authKey: string }
  app: { currency: string; language: string }
}

const getContext = (state: LocalState) => ({
  authKey: state.auth.authKey,
  currency: state.app.currency,
  language: state.app.language,
})

export const rentalsApi = createApi({
  reducerPath: 'rentalsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  tagTypes: ['Rental'],
  endpoints: builder => ({
    createRentalSettings: builder.mutation<void, RentalSettingsInput>({
      queryFn: async (input, { getState }) => {
        const { authKey, currency, language } = getContext(getState() as LocalState)
        try {
          const result = normalizeTradlyResponse(
            await rentalsAPI.createRentalSettings(input, authKey, currency, language),
            'Could not save rental settings',
          )
          if (result.error) return { error: { status: 'CUSTOM_ERROR', error: result.error.message ?? 'Could not save rental settings' } }
          return { data: undefined }
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: error instanceof Error ? error.message : 'Unexpected error' } }
        }
      },
      invalidatesTags: (_result, _error, input) => [{ type: 'Rental', id: input.listing_id }],
    }),
    // Listing detail carries no rental settings; this reads them (rate, min/max duration, deposit, units).
    getRentalSettings: builder.query<RentalSettings | null, number>({
      queryFn: async (listingId, { getState }) => {
        const { authKey, currency, language } = getContext(getState() as LocalState)
        try {
          const result = normalizeTradlyResponse(
            await rentalsAPI.getRentalSettings(listingId, authKey, currency, language),
            'Could not load rental settings',
          )
          if (result.error) return { error: { status: 'CUSTOM_ERROR', error: result.error.message ?? 'Could not load rental settings' } }
          const raw: any = result.data ?? result
          const row = Array.isArray(raw) ? raw[0] : raw
          if (!row || typeof row !== 'object') return { data: null }
          return {
            data: {
              rate_unit: row.rate_unit,
              rate_amount: Number(row.rate_amount),
              min_duration: Number(row.min_duration),
              max_duration: Number(row.max_duration),
              buffer_time: Number(row.buffer_time),
              deposit_amount: Number(row.deposit_amount),
              max_units: Number(row.max_units),
            },
          }
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: error instanceof Error ? error.message : 'Unexpected error' } }
        }
      },
      providesTags: (_result, _error, listingId) => [{ type: 'Rental', id: listingId }],
    }),
    getRentalAvailability: builder.query<unknown, RentalAvailabilityParams>({
      queryFn: async (params, { getState }) => {
        const { authKey, currency, language } = getContext(getState() as LocalState)
        try {
          const result = normalizeTradlyResponse(
            await rentalsAPI.getRentalAvailability(params, authKey, currency, language),
            'Could not check rental availability',
          )
          if (result.error) return { error: { status: 'CUSTOM_ERROR', error: result.error.message ?? 'Could not check rental availability' } }
          // The published endpoint documents query parameters but not a response schema.
          // Keep the successful payload opaque rather than inventing availability fields.
          return { data: result.data ?? result }
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: error instanceof Error ? error.message : 'Unexpected error' } }
        }
      },
      providesTags: (_result, _error, params) => [{ type: 'Rental', id: params.listing_id }],
    }),
  }),
})

export const { useCreateRentalSettingsMutation, useGetRentalAvailabilityQuery, useGetRentalSettingsQuery } = rentalsApi
