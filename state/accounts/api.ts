import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import * as accountsAPI from '@/api/accounts'
import { normalizeTradlyResponse } from '@/state/api-response'
import type { SellerAccount } from '@/api/accounts'

interface LocalState {
  auth: { authKey: string }
  app: { currency: string; language: string }
}

export const accountsApi = createApi({
  reducerPath: 'accountsApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  tagTypes: ['Account'],
  endpoints: builder => ({
    getMyAccounts: builder.query<{ accounts: SellerAccount[] }, string>({
      queryFn: async (userId, { getState }) => {
        const state = getState() as LocalState
        try {
          const response = normalizeTradlyResponse(await accountsAPI.getMyAccounts(userId, state.auth.authKey, state.app.currency, state.app.language), 'Could not load seller accounts', ['accounts'])
          if (response?.error) return { error: { status: 'CUSTOM_ERROR', error: response.error.message ?? 'Could not load seller accounts' } }
          return { data: { accounts: response.data!.accounts } }
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: error instanceof Error ? error.message : 'Unexpected error' } }
        }
      },
      providesTags: ['Account'],
    }),
    createAccount: builder.mutation<{ account: SellerAccount }, Record<string, unknown>>({
      queryFn: async (account, { getState }) => {
        const state = getState() as LocalState
        try {
          const response = normalizeTradlyResponse(await accountsAPI.createAccount(account, state.auth.authKey, state.app.currency, state.app.language), 'Could not create seller account', ['account'])
          if (response?.error) return { error: { status: 'CUSTOM_ERROR', error: response.error.message ?? 'Could not create seller account' } }
          return { data: { account: response.data!.account } }
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: error instanceof Error ? error.message : 'Unexpected error' } }
        }
      },
      invalidatesTags: ['Account'],
    }),
  }),
})

export const { useGetMyAccountsQuery, useCreateAccountMutation } = accountsApi
