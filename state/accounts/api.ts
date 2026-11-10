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
    // Public list of the store's seller accounts (for "featured sellers" and seller pages).
    getPublicAccounts: builder.query<{ accounts: SellerAccount[]; total_records: number }, number | void>({
      queryFn: async (page, { getState }) => {
        const state = getState() as LocalState
        try {
          const response = normalizeTradlyResponse(await accountsAPI.getPublicAccounts(state.auth.authKey, state.app.currency, state.app.language, page || 1), 'Could not load sellers', ['accounts'])
          if (response?.error) return { error: { status: 'CUSTOM_ERROR', error: response.error.message ?? 'Could not load sellers' } }
          return { data: { accounts: response.data!.accounts, total_records: Number((response.data as any).total_records) || 0 } }
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: error instanceof Error ? error.message : 'Unexpected error' } }
        }
      },
      providesTags: ['Account'],
    }),
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
    updateAccount: builder.mutation<{ account: SellerAccount }, { accountId: number | string; account: Record<string, unknown> }>({
      queryFn: async ({ accountId, account }, { getState }) => {
        const state = getState() as LocalState
        try {
          const response = normalizeTradlyResponse(await accountsAPI.updateAccount(accountId, account, state.auth.authKey, state.app.currency, state.app.language), 'Could not update seller account', ['account'])
          if (response?.error) return { error: { status: 'CUSTOM_ERROR', error: response.error.message ?? 'Could not update seller account' } }
          return { data: { account: response.data!.account } }
        } catch (error) {
          return { error: { status: 'CUSTOM_ERROR', error: error instanceof Error ? error.message : 'Unexpected error' } }
        }
      },
      invalidatesTags: ['Account'],
    }),
    patchAccount: builder.mutation<Record<string, unknown>, { accountId: number | string; active: boolean }>({
      queryFn: async ({ accountId, active }, { getState }) => {
        const state = getState() as LocalState
        try {
          const response = normalizeTradlyResponse(await accountsAPI.patchAccount(accountId, { active }, state.auth.authKey, state.app.currency, state.app.language), 'Could not update account status')
          if (response.error) return { error: { status: 'CUSTOM_ERROR', error: response.error.message ?? 'Could not update account status' } }
          return { data: (response.data ?? {}) as Record<string, unknown> }
        } catch (error) { return { error: { status: 'CUSTOM_ERROR', error: error instanceof Error ? error.message : 'Unexpected error' } } }
      }, invalidatesTags: (_result, _error, { accountId }) => [{ type: 'Account', id: String(accountId) }, 'Account'],
    }),
    getAccountDetail: builder.query<Record<string, unknown>, number | string>({
      queryFn: async (accountId, { getState }) => {
        const state = getState() as LocalState
        try {
          const response = normalizeTradlyResponse(await accountsAPI.getAccountDetail(accountId, state.auth.authKey, state.app.currency, state.app.language), 'Could not load account details')
          if (response.error) return { error: { status: 'CUSTOM_ERROR', error: response.error.message ?? 'Could not load account details' } }
          return { data: (response.data ?? {}) as Record<string, unknown> }
        } catch (error) { return { error: { status: 'CUSTOM_ERROR', error: error instanceof Error ? error.message : 'Unexpected error' } } }
      },
      providesTags: (_result, _error, id) => [{ type: 'Account', id: String(id) }],
    }),
    getAccountFollowers: builder.query<Record<string, unknown>, number | string>({
      queryFn: async (accountId, { getState }) => {
        const state = getState() as LocalState
        try {
          const response = normalizeTradlyResponse(await accountsAPI.getAccountFollowers(accountId, state.auth.authKey, state.app.currency, state.app.language), 'Could not load account followers')
          if (response.error) return { error: { status: 'CUSTOM_ERROR', error: response.error.message ?? 'Could not load account followers' } }
          return { data: (response.data ?? {}) as Record<string, unknown> }
        } catch (error) { return { error: { status: 'CUSTOM_ERROR', error: error instanceof Error ? error.message : 'Unexpected error' } } }
      },
      providesTags: (_result, _error, id) => [{ type: 'Account', id: `followers-${id}` }],
    }),
    getBlockedAccounts: builder.query<{ accounts: SellerAccount[] }, Record<string, unknown>>({
      queryFn: async (params, { getState }) => {
        const state = getState() as LocalState
        try {
          const response = normalizeTradlyResponse(await accountsAPI.getBlockedAccounts(params, state.auth.authKey, state.app.currency, state.app.language), 'Could not load blocked sellers', ['accounts'])
          if (response.error) return { error: { status: 'CUSTOM_ERROR', error: response.error.message ?? 'Could not load blocked sellers' } }
          return { data: { accounts: response.data!.accounts as SellerAccount[] } }
        } catch (error) { return { error: { status: 'CUSTOM_ERROR', error: error instanceof Error ? error.message : 'Unexpected error' } } }
      },
      providesTags: ['Account'],
    }),
    followAccount: builder.mutation<Record<string, unknown>, number | string>({
      queryFn: async (accountId, { getState }) => {
        const state = getState() as LocalState
        try {
          const response = normalizeTradlyResponse(await accountsAPI.followAccount(accountId, state.auth.authKey, state.app.currency, state.app.language), 'Could not follow account')
          if (response.error) return { error: { status: 'CUSTOM_ERROR', error: response.error.message ?? 'Could not follow account' } }
          return { data: (response.data ?? {}) as Record<string, unknown> }
        } catch (error) { return { error: { status: 'CUSTOM_ERROR', error: error instanceof Error ? error.message : 'Unexpected error' } } }
      }, invalidatesTags: (_result, _error, id) => [{ type: 'Account', id: String(id) }, { type: 'Account', id: `followers-${id}` }],
    }),
    unfollowAccount: builder.mutation<Record<string, unknown>, number | string>({
      queryFn: async (accountId, { getState }) => {
        const state = getState() as LocalState
        try {
          const response = normalizeTradlyResponse(await accountsAPI.unfollowAccount(accountId, state.auth.authKey, state.app.currency, state.app.language), 'Could not unfollow account')
          if (response.error) return { error: { status: 'CUSTOM_ERROR', error: response.error.message ?? 'Could not unfollow account' } }
          return { data: (response.data ?? {}) as Record<string, unknown> }
        } catch (error) { return { error: { status: 'CUSTOM_ERROR', error: error instanceof Error ? error.message : 'Unexpected error' } } }
      }, invalidatesTags: (_result, _error, id) => [{ type: 'Account', id: String(id) }, { type: 'Account', id: `followers-${id}` }],
    }),
    blockAccount: builder.mutation<Record<string, unknown>, number | string>({
      queryFn: async (accountId, { getState }) => {
        const state = getState() as LocalState
        try { const response = normalizeTradlyResponse(await accountsAPI.blockAccount(accountId, state.auth.authKey, state.app.currency, state.app.language), 'Could not block account'); if (response.error) return { error: { status: 'CUSTOM_ERROR', error: response.error.message ?? 'Could not block account' } }; return { data: (response.data ?? {}) as Record<string, unknown> } }
        catch (error) { return { error: { status: 'CUSTOM_ERROR', error: error instanceof Error ? error.message : 'Unexpected error' } } }
      }, invalidatesTags: ['Account'],
    }),
    unblockAccount: builder.mutation<Record<string, unknown>, number | string>({
      queryFn: async (accountId, { getState }) => {
        const state = getState() as LocalState
        try { const response = normalizeTradlyResponse(await accountsAPI.unblockAccount(accountId, state.auth.authKey, state.app.currency, state.app.language), 'Could not unblock account'); if (response.error) return { error: { status: 'CUSTOM_ERROR', error: response.error.message ?? 'Could not unblock account' } }; return { data: (response.data ?? {}) as Record<string, unknown> } }
        catch (error) { return { error: { status: 'CUSTOM_ERROR', error: error instanceof Error ? error.message : 'Unexpected error' } } }
      }, invalidatesTags: ['Account'],
    }),
  }),
})

export const { useGetPublicAccountsQuery, useGetMyAccountsQuery, useCreateAccountMutation, useUpdateAccountMutation, usePatchAccountMutation, useGetAccountDetailQuery, useGetAccountFollowersQuery, useGetBlockedAccountsQuery, useFollowAccountMutation, useUnfollowAccountMutation, useBlockAccountMutation, useUnblockAccountMutation } = accountsApi
