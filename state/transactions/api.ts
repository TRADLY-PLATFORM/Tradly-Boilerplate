import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import * as transactionsAPI from '@/api/transactions'
import type { TransactionQuery } from '@/api/transactions'
import { normalizeTradlyResponse } from '@/state/api-response'

interface LocalState { auth: { authKey: string }; app: { currency: string; language: string } }
const context = (state: LocalState) => ({ authKey: state.auth.authKey, currency: state.app.currency, language: state.app.language })

export const transactionsApi = createApi({
  reducerPath: 'transactionsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  endpoints: builder => ({
    getTransactions: builder.query<Record<string, unknown>, TransactionQuery>({
      queryFn: async (params, { getState }) => {
        const ctx = context(getState() as LocalState)
        try {
          const response = normalizeTradlyResponse(await transactionsAPI.getTransactions(params, ctx.authKey, ctx.currency, ctx.language), 'Could not load transactions')
          if (response.error) return { error: { status: 'CUSTOM_ERROR', error: response.error.message ?? 'Could not load transactions' } }
          return { data: (response as any).data ?? {} }
        } catch (error) { return { error: { status: 'CUSTOM_ERROR', error: error instanceof Error ? error.message : 'Unexpected error' } } }
      },
    }),
    getEarnings: builder.query<Record<string, unknown>, TransactionQuery>({
      queryFn: async (params, { getState }) => {
        const ctx = context(getState() as LocalState)
        try {
          const response = normalizeTradlyResponse(await transactionsAPI.getEarnings(params, ctx.authKey, ctx.currency, ctx.language), 'Could not load earnings')
          if (response.error) return { error: { status: 'CUSTOM_ERROR', error: response.error.message ?? 'Could not load earnings' } }
          return { data: (response as any).data ?? {} }
        } catch (error) { return { error: { status: 'CUSTOM_ERROR', error: error instanceof Error ? error.message : 'Unexpected error' } } }
      },
    }),
  }),
})

export const { useGetTransactionsQuery, useGetEarningsQuery } = transactionsApi
