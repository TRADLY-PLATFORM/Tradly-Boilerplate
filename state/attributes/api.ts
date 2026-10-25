import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import * as attributesAPI from '@/api/attributes'
import type { ListingAttribute } from '@/types/listing.types'
import { normalizeTradlyResponse } from '@/state/api-response'

interface LocalState {
  auth: { authKey: string }
  app: { currency: string; language: string }
}

export const attributesApi = createApi({
  reducerPath: 'attributesApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  keepUnusedDataFor: 300,
  endpoints: builder => ({
    getAttributes: builder.query<{ attributes: ListingAttribute[] }, attributesAPI.GetAttributesParams>({
      queryFn: async (params, { getState }) => {
        const state = getState() as LocalState
        try {
          const response = normalizeTradlyResponse(await attributesAPI.getAttributes(params, state.auth.authKey, state.app.currency, state.app.language), 'Could not load listing attributes', ['attributes'])
          if (response?.error) return { error: { status: 'CUSTOM_ERROR', error: response.error.message ?? 'Could not load listing attributes' } }
          return { data: { attributes: response.data!.attributes } }
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: error instanceof Error ? error.message : 'Unexpected error' } }
        }
      },
    }),
  }),
})

export const { useGetAttributesQuery } = attributesApi
