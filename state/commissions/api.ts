import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import * as commissionsAPI from '@/api/commissions'
import type { GetCommissionsResponse } from '@/types/checkout.types'

interface LocalState {
  auth: { authKey: string }
  app: { currency: string; language: string }
}

const ctx = (state: LocalState) => ({
  authKey: state.auth.authKey,
  currency: state.app.currency,
  language: state.app.language,
})

export const commissionsApi = createApi({
  reducerPath: 'commissionsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  tagTypes: ['Commission'],
  keepUnusedDataFor: 300,
  endpoints: (builder) => ({

    // Cart commissions — required or optional amounts the buyer enters
    // result.data → { commissions: Commission[] }
    getCartCommissions: builder.query<GetCommissionsResponse, void>({
      queryFn: async (_arg, { getState }) => {
        const { authKey, currency, language } = ctx(getState() as LocalState)
        try {
          const res = await commissionsAPI.getCommissions({ type: 'cart' }, authKey, currency, language)
          if (res?.error)
            return { error: { status: 'CUSTOM_ERROR', error: res.error.message ?? 'Failed to fetch commissions' } }
          return { data: { commissions: res.data!.commissions } }
        } catch (err) {
          return { error: { status: 'CUSTOM_ERROR', error: (err as Error).message } }
        }
      },
      providesTags: ['Commission'],
    }),

    // Demand commissions — optional add-ons buyer can toggle on/off
    // result.data → { commissions: Commission[] }
    getDemandCommissions: builder.query<GetCommissionsResponse, void>({
      queryFn: async (_arg, { getState }) => {
        const { authKey, currency, language } = ctx(getState() as LocalState)
        try {
          const res = await commissionsAPI.getCommissions({ type: 'demand', optional: true }, authKey, currency, language)
          if (res?.error)
            return { error: { status: 'CUSTOM_ERROR', error: res.error.message ?? 'Failed to fetch demand commissions' } }
          return { data: { commissions: res.data!.commissions } }
        } catch (err) {
          return { error: { status: 'CUSTOM_ERROR', error: (err as Error).message } }
        }
      },
      providesTags: ['Commission'],
    }),

  }),
})

export const {
  useGetCartCommissionsQuery,
  useGetDemandCommissionsQuery,
} = commissionsApi
