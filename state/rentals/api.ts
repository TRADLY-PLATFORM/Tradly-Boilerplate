import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import * as rentalsAPI from '@/api/rentals'
import type { RentalAvailabilityParams, RentalSettingsInput } from '@/api/rentals'
import { normalizeTradlyResponse } from '@/state/api-response'

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

export const { useCreateRentalSettingsMutation, useGetRentalAvailabilityQuery } = rentalsApi
